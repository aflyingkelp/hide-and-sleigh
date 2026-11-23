export const sledOuter=19;
export const sledInner=11;
export const sledIntro=4200;
export const sledRush=10000;
export const sledBlast=1600;
export const sledRadius=2;
export const sledStep=32;

export function newSledMatch(ids,now){
  return sledHeat({initial:ids.length,heat:0,racers:ids.map(id=>({id,alive:true,score:0}))},now);
}
function sledHeat(match,now){
  const racers=match.racers.filter(r=>r.alive);
  match.heat++;
  match.phase='lap';
  match.start=match.tick=now;
  match.deadline=now+sledIntro;
  match.winner=null;
  match.blasts=[];
  const offset=match.heat*.69;
  racers.forEach((r,i)=>{
    const angle=offset+2*Math.PI*i/racers.length;
    Object.assign(r,{x:15*Math.cos(angle),z:15*Math.sin(angle),vx:0,vz:0,
      yaw:-angle-Math.PI,angle,gift:true,ax:0,az:0,inputAt:now});
  });
  match.receivers=Array.from({length:racers.length-1},(_,i)=>{
    const angle=offset+i*Math.PI*2/(racers.length-1);
    const radius=racers.length<=3?3:5.3+(i%2)*2;
    return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,claim:null};
  });
  return match;
}
function finishSledHeat(match,at){
  const racers=match.racers.filter(r=>r.alive);
  const gifts=[...racers.filter(r=>r.gift),...match.receivers.filter(r=>r.claim),...match.blasts];
  match.blasts=gifts.map(({x,z})=>({x,z}));
  for(const r of racers){
    if(r.gift||gifts.some(g=>Math.hypot(g.x-r.x,g.z-r.z)<sledRadius))r.alive=false;
  }
  const survivors=match.racers.filter(r=>r.alive);
  for(const r of racers){
    r.score=r.alive&&survivors.length===1?10:Math.round(10*(match.initial-racers.length)/Math.max(1,match.initial-1));
  }
  match.winner=survivors.length===1?survivors[0].id:null;
  match.phase='blast';
  match.start=at;
  match.deadline=at+sledBlast;
}
export function advanceSled(match,now){
  // Advance a bounded number of fixed steps. A room with no active clients does not accrue work.
  for(let iterations=0;match.tick+sledStep<=now&&iterations<700;iterations++){
    const at=match.tick+=sledStep;
    if(match.phase==='blast'){
      if(at>=match.deadline){
        if(match.racers.filter(r=>r.alive).length<=1){match.phase='ended';return match}
        sledHeat(match,at);
      }
      continue;
    }
    if(match.phase==='ended')return match;
    if(match.phase==='lap'){
      for(const r of match.racers.filter(r=>r.alive)){
        const a=r.angle+(at-match.start)*.00054;
        r.x=15*Math.cos(a);r.z=15*Math.sin(a);r.yaw=-a-Math.PI;
        r.vx=-8.1*Math.sin(a);r.vz=8.1*Math.cos(a);
      }
      if(at>=match.deadline){
        match.phase='rush';match.start=at;match.deadline=at+sledRush;
      }
      continue;
    }
    if(at>=match.deadline){finishSledHeat(match,at);continue}
    for(const r of match.racers.filter(r=>r.alive)){
      const steer=at-r.inputAt<380;
      const damping=Math.exp(-(steer&&(r.ax||r.az)?1.85:3.2)*sledStep/1000);
      r.vx=r.vx*damping+(steer?r.ax:0)*.84;
      r.vz=r.vz*damping+(steer?r.az:0)*.84;
      const speed=Math.hypot(r.vx,r.vz);
      if(speed>10.5){r.vx*=10.5/speed;r.vz*=10.5/speed}
      r.x+=r.vx*sledStep/1000;r.z+=r.vz*sledStep/1000;
      const radial=Math.hypot(r.x,r.z);
      if(radial>sledOuter-.55){
        const nx=r.x/radial,nz=r.z/radial;
        const bounce=Math.max(0,r.vx*nx+r.vz*nz);
        r.x=nx*(sledOuter-.55);r.z=nz*(sledOuter-.55);
        r.vx-=1.35*bounce*nx;r.vz-=1.35*bounce*nz;
      }
      if(speed>.35)r.yaw=Math.atan2(-r.vx,-r.vz);
      if(!r.gift)continue;
      const target=match.receivers.find(q=>!q.claim&&Math.hypot(q.x-r.x,q.z-r.z)<1.36);
      if(target){target.claim=r.id;r.gift=false}
    }
  }
  return match;
}
export function steerSled(match,id,x,z,now){
  const racer=match.racers.find(r=>r.id===id&&r.alive);
  if(!racer)return;
  const ax=Number.isFinite(x)?x:0,az=Number.isFinite(z)?z:0;
  const length=Math.max(1,Math.hypot(ax,az));
  racer.ax=ax/length;racer.az=az/length;racer.inputAt=now;
}
export function removeSledRacer(match,id){
  const racer=match.racers.find(r=>r.id===id&&r.alive);
  if(!racer)return;
  racer.alive=false;racer.gift=false;
  if(match.phase!=='lap'&&match.phase!=='rush')return;
  const alive=match.racers.filter(r=>r.alive);
  const maximum=Math.max(0,alive.length-1);
  while(match.receivers.length>maximum){
    const unused=match.receivers.findIndex(r=>!r.claim);
    if(unused>=0)match.receivers.splice(unused,1);
    else {
      const receiver=match.receivers.pop();
      if(receiver.claim)match.blasts.push({x:receiver.x,z:receiver.z});
    }
  }
  if(alive.length<=1){
    match.winner=alive[0]?.id||null;
    if(alive[0])alive[0].score=10;
    match.phase='ended';
  }
}
