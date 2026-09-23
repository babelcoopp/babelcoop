/* Testes do gera-replicate.mjs sem rede e sem token: segredo redigido, teto da rodada, PNG em Node puro.
   Rodar (da raiz): node --test app/testes/midia/gera-replicate.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { redigir, gastoDaRodada, lerManifestos, lerPng, escreverPng, medirPng, abrirMiolo, reduzir, limparTransparentes } from '../../scripts/gera-replicate.mjs';

/* um anel sintético: disco de raio 39 % do lado, miolo escuro até 23 %, fundo transparente (em 512: raios 200 e 120) */
function anelSintetico(lado = 512, cx = lado / 2, cy = lado / 2) {
  const rgba = Buffer.alloc(lado * lado * 4); const R = lado * 200 / 512, F = lado * 120 / 512;
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    const d = Math.hypot(x - cx, y - cy); const i = (y * lado + x) * 4;
    if (d <= R) { rgba[i] = rgba[i + 1] = rgba[i + 2] = d > F ? 60 : 4; rgba[i + 3] = 255; }
  }
  return { largura: lado, altura: lado, rgba };
}

test('redigir tira o token, o Bearer e qualquer r8_…', () => {
  const tok = 'r8_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123';
  const s = redigir('Authorization: Bearer ' + tok + ' · de novo ' + tok, tok);
  assert.ok(!s.includes(tok));
  assert.match(s, /\[redigido\]/);
  assert.ok(!redigir('x r8_' + 'a'.repeat(30) + ' y', '').includes('r8_a'));
});

test('gasto da rodada soma só predições criadas daquela rodada', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'manif-'));
  fs.mkdirSync(path.join(pasta, 'm', 'd'), { recursive: true });
  fs.writeFileSync(path.join(pasta, 'm', 'd', 'MANIFESTO.jsonl'), [
    { rodada: 'r1', id: 'a', status: 'succeeded', custo_usd: 0.067 },
    { rodada: 'r1', id: 'b', status: 'failed', custo_usd: 0.067 },
    { rodada: 'r1', id: null, status: 'sem-saldo', custo_usd: 0 },
    { rodada: 'r2', id: 'c', status: 'succeeded', custo_usd: 1 },
    { nome: 'antiga, sem rodada', id: 'd', status: 'succeeded' },
  ].map((l) => JSON.stringify(l)).join('\n') + '\n{linha torta\n');
  const linhas = lerManifestos(pasta);
  assert.equal(linhas.length, 5);
  assert.equal(Number(gastoDaRodada('r1', linhas).toFixed(3)), 0.134);
  assert.equal(gastoDaRodada('r2', linhas), 1);
  fs.rmSync(pasta, { recursive: true, force: true });
});

test('PNG: escrever e ler de volta dá os mesmos pixels', () => {
  const a = anelSintetico(64);
  const b = lerPng(escreverPng(a));
  assert.equal(b.largura, 64); assert.equal(b.altura, 64);
  assert.equal(Buffer.compare(a.rgba, b.rgba), 0);
});

test('medir acha o centro, a redondeza e o miolo', () => {
  const m = medirPng(anelSintetico());
  assert.deepEqual(m.centro_caixa, [256, 256]);
  assert.ok(Math.abs(m.proporcao_rx_ry - 1) < 0.01);
  assert.ok(m.raio_externo_desvio_pct < 1);
  assert.equal(m.miolo_alfa_medio, 255);
});

test('abrir o miolo deixa o centro escuro transparente e preserva o anel', () => {
  const img = abrirMiolo(anelSintetico(), 0.55);
  const m = medirPng(img);
  assert.equal(m.miolo_alfa_medio, 0);
  const i = (256 * 512 + 256 + 170) * 4; /* ponto no corpo do anel, raio 170 */
  assert.equal(img.rgba[i + 3], 255);
});

test('limpar transparentes só mexe na cor de pixel invisível', () => {
  const a = anelSintetico(64);
  a.rgba[0] = 200; a.rgba[1] = 100; a.rgba[2] = 50; /* canto: alfa 0 com cor sobrando */
  const b = limparTransparentes(a);
  assert.deepEqual([...b.rgba.subarray(0, 4)], [0, 0, 0, 0]);
  for (let i = 0; i < a.rgba.length; i += 4) if (a.rgba[i + 3]) assert.deepEqual([...b.rgba.subarray(i, i + 4)], [...a.rgba.subarray(i, i + 4)]);
});

test('reduzir mantém o círculo centrado', () => {
  const m = medirPng(reduzir(anelSintetico(), 128));
  assert.equal(m.largura, 128);
  assert.ok(Math.abs(m.desvio_do_centro_px[0]) <= 1 && Math.abs(m.desvio_do_centro_px[1]) <= 1);
});
