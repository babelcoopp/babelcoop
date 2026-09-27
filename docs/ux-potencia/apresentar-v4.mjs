// Somente a apresentação e o Three.js local; escuta apenas neste computador.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const three=path.resolve(root,'../../app/node_modules/three/build/three.min.js');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.md':'text/plain; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=pathname==='/three.min.js'?three:path.resolve(root,'.'+(pathname==='/'?'/PLANO-V4-VISUAL.html':pathname));
    if(file!==three&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    if(!types[path.extname(file)]||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  }catch{res.writeHead(404);res.end('Arquivo não encontrado.');}
}).listen(4790,'127.0.0.1',()=>console.log('V4: http://127.0.0.1:4790/PLANO-V4-VISUAL.html'));
