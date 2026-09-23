/* Babel Coop · e2e: abre uma Estação de verdade (Electron) com raiz, porta e descoberta próprias
   As janelas abrem escondidas (BABEL_COOP_OCULTO); para ver o teste acontecendo: BABEL_COOP_VER=1.
   Duas Estações na mesma máquina não se atrapalham: cada uma tem a sua ~/BabelCoop (BABEL_COOP_RAIZ), a sua porta e a sua pasta de dados do Electron.
*/
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const { _electron } = require('playwright');

const APP = path.join(__dirname, '..', '..');

function raizTemporaria(nome) { return fs.mkdtempSync(path.join(os.tmpdir(), 'babel-e2e-' + nome + '-')); }

async function abrirEstacao({ nome = 'a', raiz = raizTemporaria(nome), porta = 4801, descoberta = 41301, env = {} } = {}) {
  const app = await _electron.launch({
    args: [APP],
    cwd: APP,
    /* BABEL_COOP_AGENTES=0: a presença não chama o claude sozinha (os e2e não gastam modelo); quem quer o agente real passa '1' em env.
       BABEL_COOP_NAV_INTERNO=1: o agente abre os sites de teste locais (em produção endereço interno é só pela pessoa; o e2e de SSRF desliga) */
    env: Object.assign({}, process.env, { BABEL_COOP_RAIZ: raiz, BABEL_COOP_PORTA: String(porta), BABEL_COOP_DESCOBERTA: String(descoberta), BABEL_COOP_OCULTO: process.env.BABEL_COOP_VER ? '' : '1', BABEL_COOP_AGENTES: '0', BABEL_COOP_NAV_INTERNO: '1' }, env)
  });
  const page = await app.firstWindow();
  const base = 'http://localhost:' + porta;
  const api = async (caminho, corpo) => {
    const r = await fetch(base + caminho, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined);
    return r.json();
  };
  return { app, page, raiz, porta, base, api, fechar: () => app.close() };
}

module.exports = { abrirEstacao, raizTemporaria, APP };
