import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const files={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/game.js':'game.js','/storage.js':'storage.js','/talents.js':'talents.js','/identities.js':'identities.js','/cutoffs.js':'cutoffs.js','/random.js':'random.js','/calibration.js':'calibration.js','/calibration-worker.js':'calibration-worker.js'};
http.createServer(async(req,res)=>{try{const name=files[new URL(req.url,'http://localhost').pathname];if(!name){res.writeHead(404);res.end('Not found');return;}const body=await readFile(root+name);res.setHeader('Content-Type',name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html; charset=utf-8');res.end(body);}catch{res.writeHead(500);res.end('Server error');}}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('CPhO simulator listening on port '+(process.env.PORT||3000)));
