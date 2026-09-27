/* babel-coop · o instalador pela rede local (servidor/instalador.js, rotas /instalar, /instalar/<arquivo> e /api/instalar/info)
   Unidade: nome só no padrão, lista só com arquivo comum da pasta, sistema pelo user-agent, só rede local.
   Servidor: uma Estação de verdade, sem equipe (sem carteira) e sem app/dist (BABEL_COOP_SEM_DIST=1): primeiro sem instalador
   nenhum (texto honesto), depois com um .dmg na pasta da equipe (a página oferece, o arquivo sai inteiro, de dentro e pelo IP da rede).
   Portas só deste arquivo: HTTP 5620, UDP 41962.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { Estacao, pedirHttp, ipDaRede } = require('./estacoes');
const instalador = require('../../servidor/instalador');

const PORTA = 5620, UDP = 41962;
const UA_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const UA_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

/* GET que devolve os bytes (o pedirHttp do harness junta texto) */
function baixar({ host = '127.0.0.1', porta = PORTA, caminho, metodo = 'GET', headers = {} }) {
  return new Promise((ok, erro) => {
    const req = http.request({ host, port: porta, path: caminho, method: metodo, headers }, (res) => {
      const partes = []; res.on('data', (c) => partes.push(c)); res.on('end', () => ok({ status: res.statusCode, headers: res.headers, corpo: Buffer.concat(partes) }));
    });
    req.on('error', erro);
    req.end();
  });
}

describe('instalador · unidade', () => {
  it('o nome só vale no padrão babel-coop-*.dmg/.exe: nada de .., barra, outra extensão ou outro arquivo', () => {
    ['babel-coop-0.1.0-arm64.dmg', 'babel-coop-0.1.0-windows-x64.exe', 'babel-coop-1.2.3-universal.dmg'].forEach((n) => assert.ok(instalador.nomeValido(n), n));
    ['coop.json', '../coop.json', 'babel-coop-..dmg', 'babel-coop-../../coop.json', 'babel-coop-a/b.dmg', 'babel-coop-a\\b.exe', 'babel-coop-0.1.0.exe.blockmap',
      'babel-coop-0.1.0.zip', 'babel-coop-.dmg', 'Babel-Coop-0.1.0.dmg', 'babel-coop-0.1.0.dmg\0.txt', '', null, undefined, 42]
      .forEach((n) => assert.equal(instalador.nomeValido(n), false, String(n)));
  });

  it('disponiveis(): só arquivo comum no padrão, da pasta da equipe; o mais novo primeiro; sem o caminho no que é público', () => {
    const antes = process.env.BABEL_COOP_SEM_DIST;
    process.env.BABEL_COOP_SEM_DIST = '1';
    try {
      const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'babel-inst-unid-'));
      assert.deepEqual(instalador.disponiveis(raiz), [], 'pasta nova: nada');
      const pasta = instalador.pastaDaEquipe(raiz);
      assert.ok(fs.statSync(pasta).isDirectory(), 'a pasta dos instaladores nasce para a gestão arrastar o arquivo');
      fs.writeFileSync(path.join(raiz, 'coop.json'), '{"segredo":"nao-sai"}');
      fs.writeFileSync(path.join(pasta, 'babel-coop-0.1.0-arm64.dmg'), 'dmg velho');
      fs.utimesSync(path.join(pasta, 'babel-coop-0.1.0-arm64.dmg'), new Date(2026, 0, 1), new Date(2026, 0, 1));
      fs.writeFileSync(path.join(pasta, 'babel-coop-0.2.0-arm64.dmg'), 'dmg novo');
      fs.writeFileSync(path.join(pasta, 'babel-coop-0.2.0-windows-x64.exe'), 'exe');
      fs.writeFileSync(path.join(pasta, 'segredo.txt'), 'x');
      fs.writeFileSync(path.join(pasta, 'babel-coop-0.2.0.zip'), 'x');
      fs.writeFileSync(path.join(pasta, 'babel-coop-0.2.0-windows-x64.exe.blockmap'), 'x');
      fs.mkdirSync(path.join(pasta, 'babel-coop-pasta.dmg'));
      if (process.platform !== 'win32') fs.symlinkSync(path.join(raiz, 'coop.json'), path.join(pasta, 'babel-coop-atalho.dmg'));
      const l = instalador.disponiveis(raiz);
      assert.deepEqual(l.map((i) => i.nome), ['babel-coop-0.2.0-arm64.dmg', 'babel-coop-0.1.0-arm64.dmg', 'babel-coop-0.2.0-windows-x64.exe']);
      assert.deepEqual([l[0].sistema, l[0].arquitetura, l[0].versao, l[0].rotulo], ['mac', 'arm64', '0.2.0', 'Mac com chip Apple (M1 ou mais novo)']);
      assert.deepEqual([l[2].sistema, l[2].arquitetura, l[2].rotulo], ['windows', 'x64', 'Windows 10 ou 11 (64 bits)']);
      assert.equal(instalador.arquivo(raiz, 'babel-coop-atalho.dmg'), null, 'atalho simbólico não sai');
      assert.equal(instalador.arquivo(raiz, '../coop.json'), null);
      assert.equal(instalador.publico(l[0]).caminho, undefined, 'o caminho no disco não vai para a tela');
      assert.equal(instalador.publico(l[0]).url, '/instalar/babel-coop-0.2.0-arm64.dmg');
    } finally { if (antes === undefined) delete process.env.BABEL_COOP_SEM_DIST; else process.env.BABEL_COOP_SEM_DIST = antes; }
  });

  it('o sistema vem do user-agent e só a rede local recebe', () => {
    assert.equal(instalador.sistemaDe(UA_MAC), 'mac');
    assert.equal(instalador.sistemaDe(UA_WIN), 'windows');
    assert.equal(instalador.sistemaDe(UA_IPHONE), 'celular');
    assert.equal(instalador.sistemaDe('Mozilla/5.0 (X11; Linux x86_64)'), 'outro');
    ['127.0.0.1', '::1', '::ffff:127.0.0.1', '192.168.1.116', '::ffff:10.0.0.3', '172.20.1.1', '169.254.3.4', '100.100.1.1', 'fe80::1', 'fd12::3']
      .forEach((a) => assert.ok(instalador.daRedeLocal(a), a));
    ['8.8.8.8', '::ffff:8.8.8.8', '172.32.0.1', '2001:4860::8888', '', undefined].forEach((a) => assert.equal(instalador.daRedeLocal(a), false, String(a)));
  });

  it('ipsDaRede(): o link sai pela placa do Wi-Fi/Ethernet, nunca pela ponte de VM, compartilhamento ou VPN', () => {
    const v4 = (address, internal = false) => ({ address, family: 'IPv4', internal, netmask: '255.255.255.0' });
    /* Mac de escritório em 10.0.0.x, com VirtualBox, UTM/Compartilhamento de Internet e Tailscale: a ordem das chaves não manda */
    assert.deepEqual(instalador.ipsDaRede({
      lo0: [v4('127.0.0.1', true)], vboxnet0: [v4('192.168.56.1')], bridge100: [v4('192.168.64.1')], utun4: [v4('100.101.1.2')],
      awdl0: [{ address: 'fe80::1', family: 'IPv6', internal: false }], en0: [v4('10.0.0.23')]
    }), ['10.0.0.23']);
    /* dois 192.168 em placas de verdade: en0 antes, seja qual for a ordem das chaves */
    assert.deepEqual(instalador.ipsDaRede({ en7: [v4('192.168.3.9')], en0: [v4('192.168.1.116')] }), ['192.168.1.116', '192.168.3.9']);
    assert.deepEqual(instalador.ipsDaRede({ en10: [v4('192.168.9.2')], en2: [v4('192.168.8.2')] }), ['192.168.8.2', '192.168.9.2']);
    /* Windows com WSL, VirtualBox e VMware: fica só o Wi-Fi */
    assert.deepEqual(instalador.ipsDaRede({
      'vEthernet (WSL)': [v4('172.28.0.1')], 'VirtualBox Host-Only Network': [v4('192.168.56.1')], 'VMware Network Adapter VMnet8': [v4('192.168.183.1')],
      'Ethernet 2': [v4('169.254.10.4')], 'Wi-Fi': [v4('192.168.0.12')]
    }), ['192.168.0.12']);
    /* Linux: docker0 e virbr0 fora; wlan antes de eth; nome desconhecido fica por último, mas fica */
    assert.deepEqual(instalador.ipsDaRede({ docker0: [v4('172.17.0.1')], virbr0: [v4('192.168.122.1')], xyz0: [v4('192.168.50.5')], eth0: [v4('10.1.2.3')], wlan0: [v4('10.1.9.9')] }),
      ['10.1.9.9', '10.1.2.3', '192.168.50.5']);
    /* só interface virtual: sem link de rede (a tela diz que não há rede), nunca um endereço que ninguém alcança */
    assert.deepEqual(instalador.ipsDaRede({ lo0: [v4('127.0.0.1', true)], bridge100: [v4('192.168.64.1')] }), []);
  });
});

describe('instalador · pela rede, numa Estação de verdade', { timeout: 60000 }, () => {
  const ip = ipDaRede();
  let est, pasta;
  before(async () => {
    est = new Estacao({ nome: 'inst', porta: PORTA, descoberta: UDP, ambiente: { BABEL_COOP_SEM_DIST: '1', BABEL_COOP_AGENTES: '0' } });
    await est.subir();
    pasta = path.join(est.raiz, '.coop', 'instaladores');
  });
  after(async () => { if (est) await est.parar(); });

  it('sem instalador nenhum: a página abre sem carteira e diz com honestidade que falta, e onde a gestão põe o arquivo', async () => {
    assert.equal((await est.eu()).pronto, false, 'a Estação nem está numa equipe');
    const r = await pedirHttp({ porta: PORTA, caminho: '/instalar', headers: { 'User-Agent': UA_WIN } });
    assert.equal(r.status, 200);
    assert.match(r.texto, /<html lang="pt-BR" data-sistema="windows">/);
    assert.match(r.texto, /Esta Estação ainda não tem o instalador para Windows\./);
    assert.match(r.texto, /Esta Estação ainda não tem o instalador para Mac\./);
    assert.ok(r.texto.includes(pasta) || r.texto.includes('/.coop/instaladores'), 'mostra a pasta onde a gestão põe o arquivo');
    assert.ok(r.texto.indexOf('id="windows"') < r.texto.indexOf('id="mac"'), 'Windows primeiro para quem está no Windows');
    assert.match(r.texto, /Mais informações → Executar assim mesmo|artefato <code>babel-coop-windows<\/code>/);
    assert.match(r.texto, /ele acha a equipe no Wi-Fi sozinho/);
    assert.ok(!/\{\{[A-Z]+\}\}/.test(r.texto), 'nenhum campo do molde ficou sem preencher');
    assert.ok(!r.texto.includes('href="/instalar/babel-coop'), 'sem arquivo, sem botão de baixar');
  });

  it('com o .dmg na pasta da equipe: a página oferece (de dentro e pelo IP da rede) e o arquivo sai inteiro, com tamanho e nome', async (t) => {
    const bytes = crypto.randomBytes(300 * 1024);
    fs.writeFileSync(path.join(pasta, 'babel-coop-9.9.9-arm64.dmg'), bytes);
    const r = await pedirHttp({ porta: PORTA, caminho: '/instalar', headers: { 'User-Agent': UA_MAC } });
    assert.equal(r.status, 200);
    assert.match(r.texto, /data-sistema="mac"/);
    assert.ok(r.texto.includes('href="/instalar/babel-coop-9.9.9-arm64.dmg"'), 'o botão de baixar aparece sem reiniciar');
    assert.match(r.texto, /Baixar para Mac com chip Apple/);
    assert.match(r.texto, /arraste o <b>babel-coop<\/b> para a pasta <b>Aplicativos<\/b>/);
    assert.match(r.texto, /Esta Estação ainda não tem o instalador para Windows\./, 'o que falta continua dito');
    assert.ok(r.texto.indexOf('id="mac"') < r.texto.indexOf('id="windows"'));

    const d = await baixar({ caminho: '/instalar/babel-coop-9.9.9-arm64.dmg' });
    assert.equal(d.status, 200);
    assert.equal(d.headers['content-length'], String(bytes.length));
    assert.equal(d.headers['content-disposition'], 'attachment; filename="babel-coop-9.9.9-arm64.dmg"');
    assert.equal(d.headers['content-type'], 'application/x-apple-diskimage');
    assert.ok(d.corpo.equals(bytes), 'os bytes chegam iguais');
    const h = await baixar({ caminho: '/instalar/babel-coop-9.9.9-arm64.dmg', metodo: 'HEAD' });
    assert.equal(h.status, 200); assert.equal(h.corpo.length, 0); assert.equal(h.headers['content-length'], String(bytes.length));

    if (!ip) return t.skip('sem IPv4 da rede local nesta máquina');
    const fora = await pedirHttp({ porta: PORTA, host: ip, caminho: '/instalar', headers: { 'User-Agent': UA_WIN } });
    assert.equal(fora.status, 200, 'outro aparelho da rede abre a página sem carteira');
    assert.ok(fora.texto.includes('http://' + ip + ':' + PORTA + '/instalar'), 'o endereço para mandar é o da rede');
    const df = await baixar({ host: ip, caminho: '/instalar/babel-coop-9.9.9-arm64.dmg' });
    assert.equal(df.status, 200);
    assert.ok(df.corpo.equals(bytes), 'pelo IP da rede o arquivo também sai inteiro');
    const cel = await pedirHttp({ porta: PORTA, host: ip, caminho: '/instalar', headers: { 'User-Agent': UA_IPHONE } });
    assert.match(cel.texto, /No celular ou no iPad não precisa instalar nada/);
  });

  it('só sai arquivo da lista: .., barra codificada, outro nome, outra extensão e método errado são recusados', async () => {
    fs.writeFileSync(path.join(pasta, 'segredo.txt'), 'SEGREDO-DA-PASTA');
    fs.writeFileSync(path.join(pasta, 'babel-coop-9.9.9.zip'), 'SEGREDO-ZIP');
    const coop = fs.readFileSync(path.join(est.raiz, 'coop.json'), 'utf8');
    assert.ok(coop.includes('"porta"'));
    const tentativas = [
      '/instalar/coop.json', '/instalar/..%2Fcoop.json', '/instalar/..%2F..%2Fcoop.json', '/instalar/%2E%2E%2Fcoop.json',
      '/instalar/babel-coop-9.9.9-arm64.dmg%2F..%2F..%2Fcoop.json', '/instalar/babel-coop-..%2F..%2Fcoop.json', '/instalar/..%5Ccoop.json',
      '/instalar/segredo.txt', '/instalar/babel-coop-9.9.9.zip', '/instalar/babel-coop-9.9.9-windows-x64.exe', '/instalar/%E0%A4%A',
      '/instalar/babel-coop-9.9.9-arm64.dmg%00.txt', '/instalar/./coop.json'
    ];
    for (const c of tentativas) {
      const r = await baixar({ caminho: c });
      assert.equal(r.status, 404, c + ' → ' + r.status);
      const s = r.corpo.toString();
      assert.ok(!s.includes('SEGREDO') && !s.includes('"porta"'), c + ' vazou conteúdo');
    }
    const post = await baixar({ caminho: '/instalar', metodo: 'POST' });
    assert.equal(post.status, 405);
  });

  it('/api/instalar/info: a própria Estação recebe o link com o IP da rede e a lista; de outro aparelho, recusado', async (t) => {
    const r = await pedirHttp({ porta: PORTA, caminho: '/api/instalar/info' });
    assert.equal(r.status, 200);
    assert.match(r.json.url, new RegExp('^http://[^/]+:' + PORTA + '/instalar$'));
    if (ip) assert.equal(r.json.url, 'http://' + instalador.ipsDaRede()[0] + ':' + PORTA + '/instalar');
    assert.deepEqual(r.json.disponiveis.map((i) => i.nome), ['babel-coop-9.9.9-arm64.dmg']);
    assert.equal(r.json.disponiveis[0].url, '/instalar/babel-coop-9.9.9-arm64.dmg');
    assert.equal(r.json.disponiveis[0].caminho, undefined);
    assert.deepEqual(r.json.falta, ['windows']);
    if (!ip) return t.skip('sem IPv4 da rede local nesta máquina');
    const fora = await pedirHttp({ porta: PORTA, host: ip, caminho: '/api/instalar/info' });
    assert.equal(fora.status, 403);
  });
});
