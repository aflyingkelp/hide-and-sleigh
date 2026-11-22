import http from 'node:http';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {api} from './worker/api.js';
fs.mkdirSync('.local',{recursive:true});const sqlite=new DatabaseSync('.local/rooms.db');sqlite.exec('PRAGMA foreign_keys=ON');const hadRooms=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rooms'").get();const migrations=fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort();
sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)');
const applied=sqlite.prepare('SELECT 1 FROM local_migrations WHERE name=?');
const mark=sqlite.prepare('INSERT OR IGNORE INTO local_migrations VALUES (?)');
if(hadRooms){mark.run(migrations[0]);if(sqlite.prepare('PRAGMA table_info(players)').all().some(column=>column.name==='rocket'))mark.run(migrations[1])}
for(const name of migrations){
 if(applied.get(name))continue;
 sqlite.exec(fs.readFileSync('drizzle/'+name,'utf8').replaceAll('--> statement-breakpoint',''));
 mark.run(name);
}
class Statement{constructor(q,args=[]){this.q=q;this.args=args}bind(...args){return new Statement(this.q,args)}async first(){return sqlite.prepare(this.q).get(...this.args)||null}async all(){return {results:sqlite.prepare(this.q).all(...this.args)}}async run(){return sqlite.prepare(this.q).run(...this.args)}}
const env={DB:{prepare:q=>new Statement(q),async batch(list){sqlite.exec('BEGIN');try{const result=[];for(const s of list)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}}};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:8765');if(url.pathname.startsWith('/api/')){const chunks=[];for await(const c of req)chunks.push(c);const r=await api(new Request(url,{method:req.method,headers:req.headers,body:Buffer.concat(chunks)}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return}const name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!['index.html','game.js','world.js','three.module.js'].includes(name)&&!/^avatars\/[1-7]\.png$/.test(name)&&!/^taunts\/[1-8]\.mp3$/.test(name)){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':name.endsWith('.mp3')?'audio/mpeg':name.endsWith('.png')?'image/png':name.endsWith('.js')?'application/javascript':'text/html','Cache-Control':'no-store'});res.end(fs.readFileSync('client/'+name))}catch(e){console.error(e.message);res.writeHead(500);res.end('Local server error')}}).listen(8765,'127.0.0.1',()=>console.log('http://127.0.0.1:8765'));
