// Servidor da apresentação, restrito ao loopback e aos artefatos desta pasta.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
const root=path.dirname(fileURLToPath(import.meta.url));
const audio=path.join(os.homedir(),'Downloads','𝗚𝗢𝗗 𝗢𝗡 𝗧𝗛𝗘 𝗖𝗢𝗗𝗘 碼神  1990s Ambient Vaporwave - Liminal Stages (youtube).mp3');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.mp3':'audio/mpeg'};
http.createServer((req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=pathname==='/audio-theus.mp3'?audio:path.resolve(root,'.'+(pathname==='/'?'/PLANO-VISUAL.html':pathname));
  if(file!==audio&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const type=mime[path.extname(file)];
  if(!type){res.writeHead(404);return res.end();}
  const stat=fs.statSync(file);if(!stat.isFile()){res.writeHead(404);return res.end();}
  const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m){res.writeHead(416);return res.end();}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),end):end;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
  headers['Content-Length']=end-start+1;res.writeHead(status,headers);
  if(req.method==='HEAD')return res.end();
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Arquivo não encontrado.');}
}).listen(4788,'127.0.0.1',()=>console.log('Apresentação: http://127.0.0.1:4788/PLANO-VISUAL.html#plano'));
