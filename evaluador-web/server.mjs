import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 5173);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8'};

function safePath(urlPath){
  const [pathname,query=''] = String(urlPath||'/').split('?');
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/engine.mjs') return join(root, 'engine.mjs');
  if (decoded === '/engine_v2.mjs') return join(root, 'engine_v2.mjs');
  if (decoded === '/engine_v3.mjs' && query === 'core=1') return join(root, 'engine_v3.mjs');
  if (decoded === '/engine_v3.mjs') return join(root, 'engine_v4.mjs');
  if (decoded === '/engine_v4.mjs') return join(root, 'engine_v4.mjs');
  const rel = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const p = normalize(join(root, 'public', rel));
  const base = normalize(join(root, 'public'));
  if (!p.startsWith(base)) return null;
  return p;
}

const server = http.createServer(async (req,res)=>{
  try{
    const p=safePath(req.url||'/');
    if(!p){res.writeHead(403);return res.end('Forbidden');}
    const info=await stat(p);
    if(!info.isFile()) throw new Error('not file');
    const body=await readFile(p);
    res.writeHead(200,{
      'Content-Type': types[extname(p)]||'application/octet-stream',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'
    });
    res.end(body);
  }catch{
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');
  }
});
server.listen(port,'127.0.0.1',()=>console.log(`Agente Evaluador V5: http://localhost:${port}`));
