import http from 'node:http';
import { createRequire } from 'node:module';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
const require = createRequire(import.meta.url);
const { criar } = require('/Users/matheussilveirapro/Desktop/babel-coop/app/servidor/coop-mcp.js');
const log = [];
let mcp;
mcp = criar({ cfg: { id: 'theus-1', pasta: '/tmp' }, registrar: (r) => log.push(r), pedirUi: (msg) => { setImmediate(() => mcp.aoMensagemUi({ tipo: 'mcp-resposta', cid: msg.cid, ok: true, resultado: { texto: 'Theus, Carla, Zuleica', dados: { pessoas: [] } } })); return true; } });
const srv = http.createServer((req, res) => {
  let corpo = ''; req.on('data', (c) => corpo += c); req.on('end', () => {
    console.log('>>', req.method, req.url, JSON.stringify({ 'mcp-protocol-version': req.headers['mcp-protocol-version'], 'mcp-method': req.headers['mcp-method'], 'mcp-name': req.headers['mcp-name'], accept: req.headers.accept }), corpo.slice(0, 300));
    req.coopCorpo = corpo;
    const fim = res.end.bind(res);
    res.end = (d) => { console.log('<<', res.statusCode, String(d || '').slice(0, 300)); return fim(d); };
    mcp.tratar(req, res, 's1', { id: 'ag', nome: 'Rita', dono: 'theus-1' });
  });
});
await new Promise((r) => srv.listen(4924, '127.0.0.1', r));
const client = new Client({ name: 'diag', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
const transport = new StreamableHTTPClientTransport(new URL('http://127.0.0.1:4924/mcp/s1'));
try {
  await client.connect(transport);
  console.log('conectou; versão:', client.getProtocolVersion ? client.getProtocolVersion() : '?');
  const t = await client.listTools();
  console.log('tools:', t.tools.length);
  const r = await client.callTool({ name: 'coop_pessoas', arguments: {} });
  console.log('call:', JSON.stringify(r).slice(0, 300));
  const e = await client.callTool({ name: 'coop_campanha', arguments: { nome: '50 clientes', meta: 50, para: 'Carla' } });
  console.log('call com argumento faltando (isError):', JSON.stringify(e));
  const n = await client.callTool({ name: 'navegador_abrir', arguments: { url: 'https://exemplo.com.br' } });
  console.log('navegador sem Electron:', JSON.stringify(n));
  try { await client.callTool({ name: 'nao_existe', arguments: {} }); } catch (x) { console.log('ferramenta inexistente (erro esperado):', x.message.slice(0, 200)); }
} catch (e) { console.log('ERRO:', e && (e.stack || e.message)); if (e && e.issues) console.log(JSON.stringify(e.issues, null, 1).slice(0, 3000)); }
await client.close().catch(() => {});
srv.close();
