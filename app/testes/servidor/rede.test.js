/* Babel Coop · rede entre Estações: uma ligação só por par (mesmo quando os dois lados ligam), sem religar à toa,
   e reconexão depois que uma Estação reinicia com a carteira que já tinha.
   Portas só deste arquivo: HTTP 4815–4817, UDP 41313.
*/
'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Estacao, esperar } = require('./estacoes');

const UDP = 41313;
const T = new Estacao({ nome: 'theus2', porta: 4815, descoberta: UDP });
const Z = new Estacao({ nome: 'zeca', porta: 4816, descoberta: UDP });
const A = new Estacao({ nome: 'ana', porta: 4817, descoberta: UDP });

async function ligacoes(e) { return (await e.api('GET', '/api/rede')).json; }
function porPar(estado) {
  const n = {};
  estado.conexoes.filter((c) => c.verificado).forEach((c) => { n[c.id] = (n[c.id] || 0) + 1; });
  return n;
}

describe('rede: uma ligação por par e reconexão', { timeout: 90000 }, () => {
  before(async () => { await Promise.all([T.subir(), Z.subir(), A.subir()]); });
  after(async () => { await Promise.all([T, Z, A].map((e) => e.parar())); });

  it('os dois lados ligam (zeca pelo encontro, Theus pela descoberta) e sobra uma ligação só, estável', async (t) => {
    assert.equal((await T.api('POST', '/api/fundar', { nome: 'Theus' })).status, 200);
    const tz = (await T.api('POST', '/api/convite', { nome: 'Zeca' })).json.token;
    const ta = (await T.api('POST', '/api/convite', { nome: 'Ana' })).json.token;
    assert.equal((await Z.api('POST', '/api/token', { token: tz })).status, 200);
    assert.equal((await A.api('POST', '/api/token', { token: ta })).status, 200);
    await T.esperarPar('zeca'); await T.esperarPar('ana'); await Z.esperarPar('ana'); await A.esperarPar('zeca');
    await esperar(5000); /* dois ciclos de anúncio e encontro */
    const antes = await Promise.all([T, Z, A].map(ligacoes));
    antes.forEach((e, i) => assert.deepEqual(Object.values(porPar(e)).filter((n) => n !== 1), [], ['theus', 'zeca', 'ana'][i] + ' com ligação duplicada: ' + JSON.stringify(e.conexoes)));
    await esperar(4500);
    const depois = await Promise.all([T, Z, A].map(ligacoes));
    depois.forEach((e, i) => {
      assert.deepEqual(porPar(e), porPar(antes[i]));
      assert.ok(e.serie - antes[i].serie <= 0, 'ligações novas sem motivo em ' + ['theus', 'zeca', 'ana'][i] + ': ' + (e.serie - antes[i].serie));
    });
    t.diagnostic('ligações abertas ao todo (série) e duplicadas fechadas: ' + depois.map((e, i) => ['theus', 'zeca', 'ana'][i] + ' ' + e.serie + '/' + e.duplicadas).join(' · '));
    t.diagnostic('ligações verificadas por par: theus ' + JSON.stringify(porPar(depois[0])) + ' · zeca ' + JSON.stringify(porPar(depois[1])) + ' · ana ' + JSON.stringify(porPar(depois[2])));
    /* diagnóstico da rede é só local */
    const ip = require('./estacoes').ipDaRede();
    if (ip) assert.equal((await T.api('GET', '/api/rede', null, { host: ip })).status, 403);
  });

  it('Zeca reinicia (mesma raiz, mesma carteira) e volta a se ligar; enquanto isso aparece desligado', async () => {
    await Z.parar();
    await T.esperarPar('zeca', (p) => !p.ligado);
    await Z.subir();
    const eu = await Z.eu();
    assert.deepEqual([eu.id, eu.papel, eu.pronto], ['zeca', 'membro', true]);
    await T.esperarPar('zeca');
    await Z.esperarPar('ana');
  });
});
