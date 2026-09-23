/* Babel Coop · o mesmo servidor no runtime do Electron (ELECTRON_RUN_AS_NODE=1): node-pty, @xterm/headless e ws
   funcionam no Node que o app usa de verdade, sem abrir janela nenhuma.
   Porta só deste arquivo: HTTP 4814, UDP 41312.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Estacao } = require('./estacoes');

let electron = null;
try { electron = require('electron'); } catch (e) { electron = null; }

describe('servidor dentro do runtime do Electron', { skip: typeof electron !== 'string' ? 'Electron não instalado' : false, timeout: 60000 }, () => {
  const E = new Estacao({ nome: 'electron', porta: 4814, descoberta: 41312, executavel: electron, ambiente: { ELECTRON_RUN_AS_NODE: '1' } });
  before(async () => { await E.subir(); });
  after(async () => { await E.parar(); });

  it('funda, abre um terminal de verdade e lê a saída e a atividade', async (t) => {
    const f = await E.api('POST', '/api/fundar', { nome: 'Theus' });
    assert.equal(f.status, 200, f.texto);
    const eu = await E.eu();
    assert.ok(eu.motor.electron, 'rodando no Electron: ' + JSON.stringify(eu.motor));
    assert.equal(eu.terminalReal, true);
    t.diagnostic('motor: Electron ' + eu.motor.electron + ' · Node ' + eu.motor.node);
    const n = await E.navegador();
    n.enviar({ tipo: 'term-abrir', id: 'e1', nome: 'agente', cols: 100, rows: 30 });
    const ab = await n.esperar((m) => m.tipo === 'term-aberto' && m.info.id === 'e1');
    assert.ok(ab.info.pid > 0);
    n.enviar({ tipo: 'term-entrada', id: 'e1', dados: 'echo "motor-$((20+22)) cc=${CLAUDECODE:-limpo} el=${ELECTRON_RUN_AS_NODE:-limpo} tp=$TERM_PROGRAM"; sleep 1\r' });
    await n.esperarSaida('theus', 'e1', 'motor-42 cc=limpo el=limpo tp=BabelCoop');
    const at = await n.esperar((m) => m.tipo === 'term-atividade' && m.id === 'e1' && m.estado === 'terminou' && m.processo === 'sleep');
    assert.ok(at.duracao >= 700);
  });

  it('a página sai com a injeção na ordem, os arquivos de /coop/ e /vendor/, e nada fora das pastas', async () => {
    const pagina = await E.api('GET', '/');
    assert.equal(pagina.status, 200);
    /* COOP_REAL traz também a lista de app/interface/midia (a interface só pede a textura que existe) */
    assert.match(pagina.texto, /window\.COOP_REAL = \{"terminal":true,"midia":\[[^\]]*"mostrador-anel\.png"/);
    const i = ['/coop/parede-real.css', '/coop/placar.css', 'ponte.js"', '/coop/organismo.js', '/coop/terminal-real.js', '/coop/parede-real.js', '/coop/navegador-real.js', '/coop/coop-ui.js', '/coop/nascendo.js', '/coop/placar.js', 'src="app.js"'].map((s) => pagina.texto.indexOf(s));
    assert.ok(i.every((x) => x > 0), JSON.stringify(i));
    assert.deepEqual(i.slice().sort((a, b) => a - b), i);
    for (const c of ['/coop/organismo.js', '/coop/terminal-real.js', '/coop/parede-real.js', '/coop/terminal-real.css', '/coop/parede-real.css', '/coop/navegador-real.css', '/coop/navegador-real.js', '/coop/coop-ui.js', '/coop/nascendo.css', '/coop/nascendo.js', '/coop/placar.css', '/coop/placar.js', '/vendor/xterm.js', '/vendor/xterm.css', '/vendor/addon-fit.js', '/ponte.js']) {
      assert.equal((await E.api('GET', c)).status, 200, c);
    }
    for (const c of ['/coop/../servidor/token.js', '/coop/%2e%2e/servidor/token.js', '/%2e%2e/app/servidor/token.js', '/coop/', '/vendor/../package.json']) {
      assert.equal((await E.api('GET', c)).status, 404, c);
    }
  });
});
