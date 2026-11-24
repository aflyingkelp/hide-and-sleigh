export const santaSize=13;
export const santaCellSize=3.8;
export const santaLimit=105000;
const santaCells=Array.from({length:santaSize},()=>Array(santaSize).fill(1));
const santaMoves=[[0,-1],[1,0],[0,1],[-1,0]];
let santaSeed=477;
function santaRandom(){santaSeed=(Math.imul(santaSeed,1664525)+1013904223)>>>0;return santaSeed/4294967296}
const santaStack=[[1,1]];
santaCells[1][1]=0;
while(santaStack.length){
  const [x,z]=santaStack.at(-1);
  const choices=santaMoves.map(([a,b])=>[x+2*a,z+2*b,a,b]).filter(([a,b])=>a>0&&b>0&&a<santaSize-1&&b<santaSize-1&&santaCells[b][a]);
  if(!choices.length){santaStack.pop();continue}
  const [a,b,dx,dz]=choices[Math.floor(santaRandom()*choices.length)];
  santaCells[z+dz][x+dx]=santaCells[b][a]=0;
  santaStack.push([a,b]);
}
for(const [x,z] of [[2,1],[4,3],[6,5],[8,7],[10,9],[3,6],[9,4],[11,8],[5,10],[7,2],[2,9]])santaCells[z][x]=0;
export const santaMaze=santaCells;
const santaCenter=(x,z)=>({x:(x+.5)*santaCellSize,z:(z+.5)*santaCellSize});
export const santaExit=santaCenter(11,11);
export const santaFuses=[[1,7],[5,5],[9,1],[7,11]].map(([x,z])=>santaCenter(x,z));
export function santaBlocked(x,z,r=.28){
  for(const dx of [-r,r])for(const dz of [-r,r]){
    if(santaMaze[Math.floor((z+dz)/santaCellSize)]?.[Math.floor((x+dx)/santaCellSize)]!==0)return true;
  }
  return false;
}
function santaClear(a,b){
  const steps=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.24)||1;
  for(let j=1;j<=steps;j++)if(santaBlocked(a.x+(b.x-a.x)*j/steps,a.z+(b.z-a.z)*j/steps))return false;
  return true;
}
export function newSantaMatch(ids,now){
  const spawn=santaCenter(1,1);
  const [forwardX,forwardZ]=santaMoves.find(([dx,dz])=>santaMaze[1+dz][1+dx]===0);
  const spawnYaw=Math.atan2(-forwardX,-forwardZ);
  return {type:'santa',phase:'running',start:now,tick:now,deadline:now+santaLimit,winner:null,santa:santaCenter(11,5),fuses:santaFuses.map(p=>({...p,found:false})),
    racers:ids.map((id,i)=>({id,x:spawn.x+(i%3-1)*.58,z:spawn.z+(Math.floor(i/3)-1)*.55,yaw:spawnYaw,alive:true,escaped:false,seen:now,score:0}))};
}
function santaRoute(match){
  const players=match.racers.filter(p=>p.alive&&!p.escaped);
  const origin=[Math.floor(match.santa.x/santaCellSize),Math.floor(match.santa.z/santaCellSize)];
  const todo=[origin],seen=new Set([origin.join()]),next=new Map();
  for(let i=0;i<todo.length;i++){
    const [x,z]=todo[i],key=[x,z].join();
    const target=players.find(p=>Math.floor(p.x/santaCellSize)===x&&Math.floor(p.z/santaCellSize)===z);
    if(target){
      const step=next.get(key);
      return step?santaCenter(...step):target;
    }
    for(const [dx,dz] of santaMoves){
      const move=[x+dx,z+dz],id=move.join();
      if(santaMaze[move[1]]?.[move[0]]!==0||seen.has(id))continue;
      seen.add(id);next.set(id,next.get(key)||move);todo.push(move);
    }
  }
  return null;
}
export function advanceSanta(match,now,ids){
  if(match.phase==='ended')return;
  for(const p of match.racers)if(!ids.has(p.id)&&!p.escaped)p.alive=false;
  if(now-match.start>4500){
    let target=match.santaTarget;
    if(!target||Math.hypot(target.x-match.santa.x,target.z-match.santa.z)<.14){
      const next=santaRoute(match);
      match.santaTarget=target=next?{x:next.x,z:next.z}:null;
    }
    if(target){
      const dx=target.x-match.santa.x,dz=target.z-match.santa.z;
      const length=Math.hypot(dx,dz);
      const travel=Math.min(length,Math.min(.24,Math.max(0,(now-match.tick)/1000))*(4.05+(now-match.start)/95000));
      if(length>.01){
        const x=match.santa.x+dx/length*travel,z=match.santa.z+dz/length*travel;
        if(!santaBlocked(x,z,.32)){match.santa.x=x;match.santa.z=z}
        else if(!santaBlocked(x,match.santa.z,.32))match.santa.x=x;
        else if(!santaBlocked(match.santa.x,z,.32))match.santa.z=z;
      }
    }
  }
  match.tick=now;
  const cleared=match.fuses.every(f=>f.found);
  for(const p of match.racers){
    if(!p.alive||p.escaped)continue;
    if(Math.hypot(p.x-match.santa.x,p.z-match.santa.z)<.88&&santaClear(p,match.santa)){
      p.alive=false;p.score=Math.min(8,2*match.fuses.filter(f=>f.found).length);
    }else if(cleared&&Math.hypot(p.x-santaExit.x,p.z-santaExit.z)<1.1){
      p.escaped=true;p.score=10;match.winner??=p.id;
    }
  }
  if(now>=match.deadline||!match.racers.some(p=>p.alive&&!p.escaped)){
    match.phase='ended';
    for(const p of match.racers)if(!p.escaped)p.score=Math.max(p.score,2*match.fuses.filter(f=>f.found).length);
  }
}
export function updateSantaPlayer(match,id,body,now){
  const p=match.racers.find(r=>r.id===id&&r.alive&&!r.escaped);
  if(!p||match.phase==='ended')return;
  const x=Number(body.x),z=Number(body.z);
  const max=7.4*Math.min(.6,Math.max(.07,(now-p.seen)/1000))+.16;
  if(Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=max&&santaClear(p,{x,z})){
    p.x=x;p.z=z;
    for(const f of match.fuses)if(!f.found&&Math.hypot(p.x-f.x,p.z-f.z)<1.12)f.found=true;
  }
  p.seen=now;
  if(Number.isFinite(body.yaw))p.yaw=body.yaw;
}
