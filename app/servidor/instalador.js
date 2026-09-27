/* babel-coop · o instalador pela rede local
   Para a equipe instalar sem mandar arquivo por WhatsApp: a Estação serve a página /instalar e os instaladores
   (babel-coop-*.dmg, babel-coop-*.exe) para qualquer aparelho da rede local, sem carteira: é só a página de download.
   - Onde procura, nesta ordem: <raiz BabelCoop>/.coop/instaladores/ (a gestão arrasta o .dmg/.exe para lá) e, no app de
     desenvolvimento, app/dist/ (o que `npm run empacotar` gera). O .dmg não vai dentro do .app (dobraria o tamanho).
   - Só sai arquivo que está na lista (nome no padrão, arquivo comum, sem atalho simbólico): o nome pedido nunca vira caminho.
   - Só para loopback e endereços de rede local (10/8, 172.16/12, 192.168/16, 169.254/16, 100.64/10, fc00::/7, fe80::/10).
   BABEL_COOP_SEM_DIST=1 ignora app/dist (os testes precisam de uma Estação sem instalador nenhum).
*/
'use strict';
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const config = require('./config');

const PADRAO = /^babel-coop-[A-Za-z0-9][A-Za-z0-9._-]{0,100}\.(dmg|exe)$/;
const PAGINA = path.join(__dirname, '..', 'interface', 'instalar.html');
const TIPO = { dmg: 'application/x-apple-diskimage', exe: 'application/vnd.microsoft.portable-executable' };

const nomeValido = (nome) => typeof nome === 'string' && PADRAO.test(nome) && !nome.includes('..');
const pastaDaEquipe = (raiz) => path.join(raiz || config.RAIZ, '.coop', 'instaladores');
function pastas(raiz) {
  const l = [pastaDaEquipe(raiz)];
  if (process.env.BABEL_COOP_SEM_DIST !== '1') l.push(path.join(__dirname, '..', 'dist'));
  return l;
}

function descrever(nome) {
  const sistema = nome.endsWith('.dmg') ? 'mac' : 'windows';
  const arquitetura = /arm64/i.test(nome) ? 'arm64' : /universal/i.test(nome) ? 'universal' : /(x64|x86_64|amd64)/i.test(nome) ? 'x64' : null;
  const versao = (nome.match(/^babel-coop-(\d+\.\d+\.\d+[A-Za-z0-9.]*)/) || [])[1] || null;
  const rotulo = sistema === 'mac'
    ? ({ arm64: 'Mac com chip Apple (M1 ou mais novo)', x64: 'Mac com processador Intel', universal: 'Mac (chip Apple ou Intel)' }[arquitetura] || 'Mac')
    : (arquitetura === 'x64' ? 'Windows 10 ou 11 (64 bits)' : 'Windows');
  return { sistema, arquitetura, versao, rotulo };
}

/* os instaladores que esta Estação tem agora, o mais novo primeiro; mesmo nome nas duas pastas: vale o da equipe */
function disponiveis(raiz) {
  try { fs.mkdirSync(pastaDaEquipe(raiz), { recursive: true }); } catch (e) { /* sem permissão: segue só com o que houver */ }
  const vistos = new Set(), lista = [];
  pastas(raiz).forEach((pasta) => {
    let nomes = [];
    try { nomes = fs.readdirSync(pasta); } catch (e) { return; }
    nomes.filter(nomeValido).forEach((nome) => {
      if (vistos.has(nome)) return;
      const caminho = path.join(pasta, nome);
      let st; try { st = fs.lstatSync(caminho); } catch (e) { return; }
      if (!st.isFile()) return; /* atalho simbólico, pasta ou outra coisa: fora */
      vistos.add(nome);
      lista.push(Object.assign({ nome, tamanho: st.size, mudado: st.mtimeMs, caminho, pasta }, descrever(nome)));
    });
  });
  return lista.sort((a, b) => (a.sistema === b.sistema ? b.mudado - a.mudado || (a.nome < b.nome ? 1 : -1) : a.sistema === 'mac' ? -1 : 1));
}
/* o que a tela e a página mostram (sem o caminho no disco) */
const publico = (i) => ({ nome: i.nome, sistema: i.sistema, arquitetura: i.arquitetura, versao: i.versao, rotulo: i.rotulo, tamanho: i.tamanho, url: '/instalar/' + encodeURIComponent(i.nome) });

/* o nome pedido só vale se está na lista: nunca vira caminho */
function arquivo(raiz, nome) { return nomeValido(nome) ? disponiveis(raiz).find((i) => i.nome === nome) || null : null; }

function sistemaDe(ua) {
  ua = String(ua || '');
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return 'celular';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  return 'outro';
}

/* IPv4 da rede local desta máquina, pelo que a equipe alcança no Wi-Fi: primeiro a interface (en0/Wi-Fi, depois outra
   placa de verdade, depois nome desconhecido), só então a faixa (192.168, 10, 172.16–31); sem 169.254. Ponte de VM,
   Compartilhamento de Internet, VPN e afins ficam fora: o 192.168.56.1 do VirtualBox ou o 192.168.64.1 do bridge100 viram
   um link que ninguém do Wi-Fi abre. `ifs` é para teste (padrão: os.networkInterfaces()). */
const VIRTUAL = /^(bridge|vboxnet|vmnet|vnic|utun|tun|tap|ppp|ipsec|gif|stf|awdl|llw|anpi|ap\d|docker|br-|veth|virbr|lxc|lxd|cni|flannel|cali|kube|zt|tailscale|wg|nordlynx|ham)|vethernet|virtualbox|vmware|hyper-v|virtual|tailscale|zerotier|hamachi|wsl|docker|vpn|npcap|bluetooth|loopback/i;
const PRINCIPAL = /^(en0|wi-?fi|wlan|wl)/i; /* a placa do Wi-Fi (no Mac, en0 é a Wi-Fi do notebook ou a Ethernet do iMac/mini) */
const PLACA = /^(en\d|eth|wlp|enp|eno|ens|ethernet|conex|local area connection)/i;
function ipsDaRede(ifs) {
  ifs = ifs || os.networkInterfaces();
  const lista = [];
  Object.keys(ifs).forEach((k) => {
    if (VIRTUAL.test(k)) return;
    const tipo = PRINCIPAL.test(k) ? 0 : PLACA.test(k) ? 1 : 2;
    (ifs[k] || []).forEach((i) => { if ((i.family === 'IPv4' || i.family === 4) && !i.internal && !i.address.startsWith('169.254.')) lista.push({ ip: i.address, tipo, nome: k }); });
  });
  const faixa = (ip) => (/^192\.168\./.test(ip) ? 0 : /^10\./.test(ip) ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ? 2 : 3);
  return lista
    .sort((a, b) => a.tipo - b.tipo || faixa(a.ip) - faixa(b.ip) || a.nome.localeCompare(b.nome, 'en', { numeric: true }))
    .map((x) => x.ip);
}

/* quem pede: esta máquina ou um aparelho da rede local (nunca um endereço público) */
function daRedeLocal(endereco) {
  let a = String(endereco || '').toLowerCase();
  if (a.startsWith('::ffff:') && net.isIPv4(a.slice(7))) a = a.slice(7);
  if (net.isIPv4(a)) {
    const [x, y] = a.split('.').map(Number);
    return x === 127 || x === 10 || (x === 172 && y >= 16 && y <= 31) || (x === 192 && y === 168) || (x === 169 && y === 254) || (x === 100 && y >= 64 && y <= 127);
  }
  if (net.isIPv6(a)) return a === '::1' || /^f[cd]/.test(a) || /^fe[89ab]/.test(a);
  return false;
}

/* GET /api/instalar/info (só a própria Estação): o link para a tela Convidar mostrar */
function info({ raiz, porta } = {}) {
  porta = porta || 4711;
  const ips = ipsDaRede();
  const lista = disponiveis(raiz);
  const falta = ['mac', 'windows'].filter((s) => !lista.some((i) => i.sistema === s));
  return {
    url: 'http://' + (ips[0] || 'localhost') + ':' + porta + '/instalar',
    urls: ips.map((ip) => 'http://' + ip + ':' + porta + '/instalar'),
    rede: ips.length > 0,
    disponiveis: lista.map(publico),
    falta,
    pasta: pastaDaEquipe(raiz)
  };
}

/* ---------- a página ---------- */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mb = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1).replace('.', ',') + ' GB' : Math.max(1, Math.round(n / 1e6)) + ' MB');
function pastaParaMostrar(raiz) {
  const p = pastaDaEquipe(raiz), casa = os.homedir();
  return process.platform !== 'win32' && casa && p.startsWith(casa + path.sep) ? '~' + p.slice(casa.length).split(path.sep).join('/') : p;
}

const PASSOS = {
  mac: [
    'Abra o <b>.dmg</b> que baixou (fica em Downloads) e arraste o <b>babel-coop</b> para a pasta <b>Aplicativos</b>.',
    'Na primeira vez, em Aplicativos: botão direito (ou Control + clique) no babel-coop → <b>Abrir</b> → <b>Abrir</b>. O app ainda não tem a assinatura da Apple, por isso o aviso. Se o botão Abrir não aparecer: <b>Ajustes do Sistema → Privacidade e Segurança</b> → <b>Abrir Mesmo Assim</b>.',
    'Quando o Mac perguntar se o babel-coop pode encontrar dispositivos na rede local, clique em <b>Permitir</b>. Sem isso ninguém da equipe vê você.'
  ],
  windows: [
    'Dê dois cliques no <b>.exe</b> que baixou (fica em Downloads). A instalação é automática e cria o atalho na Área de Trabalho.',
    'Se aparecer "O Windows protegeu o computador": <b>Mais informações → Executar assim mesmo</b>. O app ainda não tem assinatura, por isso o aviso.',
    'Se o Firewall do Windows perguntar, marque <b>Redes privadas</b> e clique em <b>Permitir acesso</b>. Sem isso ninguém da equipe vê você.'
  ]
};
const COMO_POR = {
  mac: 'o <code>.dmg</code> sai de <code>npm run empacotar</code> (em <code>app/dist/</code>) ou do GitHub, aba Actions, artefato <code>babel-coop-mac</code>',
  windows: 'o <code>.exe</code> sai do GitHub, aba Actions, artefato <code>babel-coop-windows</code> (abra o .zip para tirar o .exe)'
};

function secao(sistema, lista, seu, raiz) {
  const meus = lista.filter((i) => i.sistema === sistema);
  const titulo = sistema === 'mac' ? 'Mac' : 'Windows';
  let corpo;
  if (meus.length) {
    corpo = '<div class="baixar">' + meus.map((i, n) =>
      '<a class="botao' + (n === 0 ? ' principal' : '') + '" href="/instalar/' + encodeURIComponent(i.nome) + '" download="' + esc(i.nome) + '">' +
      '<span class="acao">Baixar para ' + esc(i.rotulo) + '</span><span class="detalhe">' + esc(i.nome) + ' · ' + mb(i.tamanho) + '</span></a>').join('') + '</div>' +
      (sistema === 'mac' && meus.every((i) => i.arquitetura === 'arm64') ? '<p class="nota">Mac com processador Intel ainda não tem instalador.</p>' : '') +
      '<ol class="passos">' + PASSOS[sistema].map((t) => '<li>' + t + '</li>').join('') + '</ol>' +
      (sistema === 'mac' ? '<p class="nota">Se o app não abrir de jeito nenhum, abra o Terminal e rode, uma vez: <code class="copiar">xattr -dr com.apple.quarantine /Applications/babel-coop.app</code></p>' : '');
  } else {
    corpo = '<div class="falta"><p><b>Esta Estação ainda não tem o instalador para ' + titulo + '.</b></p>' +
      '<p>Quem é da gestão coloca o arquivo <code>babel-coop-…' + (sistema === 'mac' ? '.dmg' : '.exe') + '</code> na pasta <code class="copiar">' + esc(pastaParaMostrar(raiz)) + '</code> deste computador: ' + COMO_POR[sistema] + '. A página passa a oferecer o arquivo na hora, sem reiniciar nada.</p>' +
      (process.platform === 'darwin' ? '<p class="nota">A pasta .coop fica escondida no Mac: no Finder, <b>Ir → Ir para a Pasta</b> (⌘ ⇧ G) e cole o caminho.</p>' : '') + '</div>';
  }
  return '<section class="sistema' + (seu ? ' seu' : '') + '" id="' + sistema + '"><h2>' + titulo + (seu ? ' <span class="selo">o seu</span>' : '') + '</h2>' + corpo + '</section>';
}

function pagina({ raiz, ua, host } = {}) {
  const sistema = sistemaDe(ua);
  const lista = disponiveis(raiz);
  const ordem = sistema === 'windows' ? ['windows', 'mac'] : ['mac', 'windows'];
  const endereco = 'http://' + String(host || 'localhost') + '/instalar';
  const aviso = sistema === 'celular'
    ? 'Este link é para instalar no computador (Mac ou Windows). No celular ou no iPad não precisa instalar nada: a Estação abre direto no navegador em <code>' + esc('http://' + String(host || 'localhost') + '/') + '</code>.'
    : sistema === 'outro' ? 'O babel-coop ainda não tem instalador para este sistema: só Mac e Windows.' : '';
  const html = fs.readFileSync(PAGINA, 'utf8');
  const partes = {
    SISTEMA: esc(sistema),
    AVISO: aviso,
    SECOES: ordem.map((s) => secao(s, lista, s === sistema, raiz)).join('\n'),
    ENDERECO: esc(endereco)
  };
  return html.replace(/\{\{([A-Z]+)\}\}/g, (m, k) => (k in partes ? partes[k] : m));
}

/* GET /instalar e GET /instalar/<arquivo> (servidor.js): qualquer aparelho da rede local, sem carteira */
function tratar(req, res, p, { raiz } = {}) {
  const textoPuro = (code, t) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(t); };
  if (!daRedeLocal(req.socket.remoteAddress)) { req.resume(); return textoPuro(403, 'O instalador do babel-coop só sai para a rede local.'); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { req.resume(); res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  if (p === '/instalar' || p === '/instalar/') {
    const html = pagina({ raiz, ua: req.headers['user-agent'], host: req.headers.host });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': Buffer.byteLength(html), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    return res.end(req.method === 'HEAD' ? undefined : html);
  }
  let nome;
  try { nome = decodeURIComponent(p.slice('/instalar/'.length)); } catch (e) { return textoPuro(404, 'Esse instalador não existe nesta Estação.'); }
  const i = arquivo(raiz, nome);
  if (!i) return textoPuro(404, 'Esse instalador não existe nesta Estação. Veja os que existem em /instalar.');
  res.writeHead(200, {
    'Content-Type': TIPO[nome.split('.').pop()], 'Content-Length': i.tamanho,
    'Content-Disposition': 'attachment; filename="' + nome + '"', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(i.caminho).on('error', () => res.destroy()).pipe(res);
}

module.exports = { disponiveis, arquivo, info, pagina, tratar, sistemaDe, daRedeLocal, nomeValido, pastas, pastaDaEquipe, ipsDaRede, publico };
