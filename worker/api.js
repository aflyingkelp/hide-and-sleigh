import {blocked,clearLine,props,spawn,rocketPath,rocketCooldown,rocketRadius} from '../client/world.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const publicPlayer=p=>({id:p.id,name:p.name,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,prop:p.prop,caught:!!p.caught,light:!!p.light,rocket:p.rocket?JSON.parse(p.rocket):null});
const pagesOrigin = 'https://aflyingkelp.github.io';
export async function api(request, env) {
 const origin = request.headers.get('Origin');
 const fromPages = origin === pagesOrigin;
 if (origin && !fromPages && origin !== new URL(request.url).origin) {
  return json({error:'Origin rejected'}, 403);
 }
 if (!fromPages) return roomRequest(request, env);
 if (request.method === 'OPTIONS') {
  return new Response(null, {status:204, headers:{
   'Access-Control-Allow-Origin':pagesOrigin,
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type',
   'Access-Control-Max-Age':'600',
   'Vary':'Origin'
  }});
 }
 const result = await roomRequest(request, env);
 const headers = new Headers(result.headers);
 headers.set('Access-Control-Allow-Origin', pagesOrigin);
 headers.append('Vary', 'Origin');
 return new Response(result.body, {status:result.status, headers});
}
async function roomRequest(request,env){try{
 if(request.method!=='POST')return json({error:'Use POST'},405);
 if(Number(request.headers.get('content-length')||0)>4096)fail('Request too large',413);
 const body=await request.json();if(!body||typeof body!=='object')fail('Invalid request');
 const now=Date.now(),db=env.DB,url=new URL(request.url),action=url.pathname.slice(5);if(!db)fail('Multiplayer database is not connected yet.',503);
 const sql=(q,...args)=>db.prepare(q).bind(...args);
 if(action==='create'||action==='join'){
  const name=String(body.name||'Player').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,18)||'Player';
  const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();let code,room,ps=[];
  if(action==='create'){
   code=Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[v%32]).join('');
   await sql('DELETE FROM rooms WHERE expires < ?',now).run();
   await sql('INSERT INTO rooms(code,host,expires) VALUES(?,?,?)',code,id,now+86400000).run();
   room={code,phase:'lobby'};
  }else{code=String(body.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))fail('Enter the six-character room code.');room=await sql('SELECT * FROM rooms WHERE code=? AND expires>?',code,now).first();if(!room)fail('Room not found or expired.',404);ps=(await sql('SELECT id FROM players WHERE room=? AND seen>?',code,now-45000).all()).results;if(ps.length>=10)fail('This room is full (10 players).',409);}
  const pos=spawn(ps.length);await sql('INSERT INTO players(id,token,room,name,x,z,caught,seen) VALUES(?,?,?,?,?,?,?,?)',id,token,code,name,pos.x,pos.z,room.phase==='lobby'||room.phase==='ended'?0:1,now).run();
  return json({id,token,code});
 }
 const p=await sql('SELECT * FROM players WHERE id=? AND token=?',String(body.id||''),String(body.token||'')).first();if(!p)fail('Session expired. Join the room again.',401);
 let room=await sql('SELECT * FROM rooms WHERE code=? AND expires>?',p.room,now).first();if(!room)fail('Room expired. Create a new room.',404);
 let roster=(await sql('SELECT * FROM players WHERE room=? AND seen>? ORDER BY id',p.room,now-45000).all()).results;
 if(!roster.some(q=>q.id===room.host)){room.host=p.id;await sql('UPDATE rooms SET host=? WHERE code=?',p.id,p.room).run()}
 let phase=room.phase;if(phase==='playing')phase=now<room.starts+20000?'hiding':now<room.starts+200000?'seeking':'ended';
 if(action==='leave'){await sql('DELETE FROM players WHERE id=?',p.id).run();return json({left:true})}
 if(action==='start'){
  if(room.host!==p.id)fail('Only the room host can start.',403);if(roster.length<2)fail('At least two players are needed. Share your room code.');
  const chosen=roster.find(q=>q.id===body.seeker)||roster[room.round%roster.length];
  await db.batch([sql("UPDATE rooms SET phase='playing',starts=?,seeker=?,round=round+1,winner=NULL WHERE code=?",now,chosen.id,p.room),...roster.map((q,i)=>{const pos=spawn(i,q.id===chosen.id);return sql('UPDATE players SET x=?,z=?,prop=-1,caught=0,light=0,tagged=0,rocket=NULL WHERE id=?',pos.x,pos.z,q.id)})]);
  return json({started:true});
 }
 if(action==='morph'){
  if(p.id===room.seeker&&room.phase==='playing')fail('Seekers cannot copy objects.');if(p.caught&&room.phase==='playing')fail('You have been caught. Wait for the next round.');
  const id=Number(body.prop);if(id===-1){await sql('UPDATE players SET prop=-1 WHERE id=?',p.id).run();return json({prop:-1})}
  const target=props[id];if(!Number.isInteger(id)||!target)fail('Aim at a copyable object.');
  if(Math.hypot(p.x-target.x,p.z-target.z)>5.5||!clearLine(p,target))fail('Get closer to that object.');
  if(blocked(p.x,p.z,target.r))fail('Move away from the wall before transforming.');
  await sql('UPDATE players SET prop=?,light=0 WHERE id=?',id,p.id).run();return json({prop:id});
 }
 if(action==='rocket'){
  if(p.id!==room.seeker||phase!=='seeking')fail('The launcher unlocks after the hiding countdown.',403);
  const yaw=Number(body.yaw),pitch=Number(body.pitch);
  if(!Number.isFinite(yaw)||!Number.isFinite(pitch)||Math.abs(pitch)>1.25)fail('Invalid aim.');
  const fired=await sql('UPDATE players SET tagged=? WHERE id=? AND tagged<=?',now,p.id,now-rocketCooldown).run();
  if(!(fired.meta?.changes??fired.changes))fail('Launcher recharging.',429);
  const hiders=roster.filter(q=>q.id!==p.id&&!q.caught);
  const {start,impact}=rocketPath(p.x,p.z,yaw,pitch,hiders);
  const hits=hiders.filter(q=>{
   const height=(props[q.prop]?.h||1.9)*.5;
   return Math.hypot(q.x-impact.x,height-impact.y,q.z-impact.z)<=rocketRadius&&clearLine(impact,q);
  });
  const shot={time:now,start,impact};
  await db.batch([
   sql('UPDATE players SET rocket=? WHERE id=?',JSON.stringify(shot),p.id),
   ...hits.map(q=>sql('UPDATE players SET caught=1,prop=-1,light=0 WHERE id=?',q.id))
  ]);
  return json({...shot,hits:hits.map(q=>q.name)});
 }
 if(action==='tag'){
  if(p.id!==room.seeker||phase!=='seeking')fail('Tagging unlocks when the hiding countdown ends.');if(now-p.tagged<900)fail('Wait a moment before searching again.',429);
  await sql('UPDATE players SET tagged=? WHERE id=?',now,p.id).run();const target=roster.find(q=>q.id===body.target&&!q.caught&&q.id!==p.id);
  if(!target||Math.hypot(target.x-p.x,target.z-p.z)>5.5||!clearLine(p,target))return json({hit:false});
  await sql('UPDATE players SET caught=1,prop=-1,light=0 WHERE id=?',target.id).run();return json({hit:true,name:target.name});
 }
 if(action!=='sync')fail('Unknown action',404);
 let x=Number(body.x),z=Number(body.z);const maxStep=Math.min(2,Math.max(.15,(now-p.seen)/1000))*8+1;
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-p.x,z-p.z)>maxStep||blocked(x,z,p.prop>=0?props[p.prop]?.r||.32:.32)||!clearLine(p,{x,z})||(p.id===room.seeker&&phase==='hiding')){x=p.x;z=p.z}
 const yaw=Number.isFinite(body.yaw)?body.yaw:0,pitch=Number.isFinite(body.pitch)?Math.max(-1.3,Math.min(1.3,body.pitch)):0;
 await sql('UPDATE players SET x=?,z=?,yaw=?,pitch=?,seen=?,light=? WHERE id=?',x,z,yaw,pitch,now,body.light&&p.prop<0&&!p.caught?1:0,p.id).run();
 roster=(await sql('SELECT * FROM players WHERE room=? AND seen>? ORDER BY id',p.room,now-45000).all()).results;
 if(room.phase==='playing'){
  const hiders=roster.filter(q=>q.id!==room.seeker),seekerAlive=roster.some(q=>q.id===room.seeker);
  if(!seekerAlive||phase==='ended'||(hiders.length>0&&hiders.every(q=>q.caught))){const winner=!seekerAlive||phase==='ended'?'hiders':'seeker';await sql("UPDATE rooms SET phase='ended',winner=? WHERE code=? AND phase='playing'",winner,p.room).run();room.phase='ended';room.winner=winner;phase='ended'}
 }
 return json({now,room:{code:room.code,host:room.host,seeker:room.seeker,phase,round:room.round,starts:room.starts,winner:room.winner},players:roster.map(publicPlayer)});
 }catch(e){return json({error:e.status?e.message:'Server error. Please try again.'},e.status||500)}}
