export const sledOuter=24;
export const sledInner=13;
export const sledIntro=4200;
export const sledRush=10000;
export const sledBlast=1600;
export const sledRadius=2;
export const sledStep=32;
const sledLane=18.5;

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
    Object.assign(r,{x:sledLane*Math.cos(angle),z:sledLane*Math.sin(angle),yaw:-angle-Math.PI,turnRate:0,
      vx:0,vz:0,gift:true,ax:0,az:0,inputAt:now});
  });
  match.receivers=Array.from({length:racers.length-1},(_,i)=>{
    const angle=offset+i*Math.PI*2/(racers.length-1);
    const radius=racers.length<=3?3:5.3+(i%2)*2;
    return {x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,claim:null};
  });
  return match;
}
// The small rink favors controllable turns with a little ice drift.
export function driveSled(racer,turn,throttle,dt,hollow=false){
  const steps=Math.max(1,Math.ceil(dt*120));
  for(let i=0;i<steps;i++)driveSledStep(racer,turn,throttle,dt/steps,hollow);
}
function driveSledStep(racer,turn,throttle,dt,hollow){
  const speed=Math.hypot(racer.vx,racer.vz);
  const desiredTurn=turn*(.9+.48*Math.min(speed/9,1));
  racer.turnRate=(racer.turnRate||0)+(desiredTurn-(racer.turnRate||0))*(1-Math.exp(-dt*8));
  racer.yaw-=racer.turnRate*dt;
  const forwardX=-Math.sin(racer.yaw),forwardZ=-Math.cos(racer.yaw);
  const along=racer.vx*forwardX+racer.vz*forwardZ;
  const grip=Math.exp(-dt*(throttle<0?4.8:3.45));
  const drag=Math.exp(-dt*(throttle<0&&along>.85?5:throttle===0?1.15:.35));
  const acceleration=throttle>1?21:throttle>0?17:throttle<0&&along<.85?-5:0;
  racer.vx=((racer.vx-along*forwardX)*grip+along*forwardX)*drag+forwardX*acceleration*dt;
  racer.vz=((racer.vz-along*forwardZ)*grip+along*forwardZ)*drag+forwardZ*acceleration*dt;
  const nextSpeed=Math.hypot(racer.vx,racer.vz);
  const limit=throttle>1?17.5:throttle<0&&along<0?5.5:13.5;
  if(nextSpeed>limit){
    const speed=limit+(nextSpeed-limit)*Math.exp(-dt*26);
    racer.vx*=speed/nextSpeed;racer.vz*=speed/nextSpeed;
  }
  racer.x+=racer.vx*dt;racer.z+=racer.vz*dt;
  const radial=Math.hypot(racer.x,racer.z);
  if(hollow&&radial<sledInner+.57&&radial>.001){
    const nx=racer.x/radial,nz=racer.z/radial;
    const inward=Math.min(0,racer.vx*nx+racer.vz*nz);
    racer.x=nx*(sledInner+.57);racer.z=nz*(sledInner+.57);
    racer.vx-=inward*nx;racer.vz-=inward*nz;
  }
  if(radial>sledOuter-.63){
    const nx=racer.x/radial,nz=racer.z/radial;
    const outward=Math.max(0,racer.vx*nx+racer.vz*nz);
    racer.x=nx*(sledOuter-.63);racer.z=nz*(sledOuter-.63);
    racer.vx-=1.04*outward*nx;racer.vz-=1.04*outward*nz;
  }
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
      if(at>=match.deadline){
        match.phase='rush';match.start=at;match.deadline=at+sledRush;
      }
    }
    if(match.phase==='rush'&&at>=match.deadline){finishSledHeat(match,at);continue}
    for(const r of match.racers.filter(r=>r.alive)){
      const steer=at-r.inputAt<380;
      driveSled(r,steer?r.ax:0,steer?-r.az:0,sledStep/1000,match.phase==='lap');
    }
  }
  return match;
}
export function deliverSledGift(match,id){
  if(match.phase!=='rush')return 'The ice has to freeze first.';
  const racer=match.racers.find(p=>p.id===id&&p.alive);
  if(!racer?.gift)return 'You have no gift to deliver.';
  const receiver=match.receivers.filter(q=>!q.claim&&Math.hypot(q.x-racer.x,q.z-racer.z)<2.15)
    .sort((a,b)=>Math.hypot(a.x-racer.x,a.z-racer.z)-Math.hypot(b.x-racer.x,b.z-racer.z))[0];
  if(!receiver)return 'Get closer to an open green receiver.';
  receiver.claim=id;
  racer.gift=false;
  return null;
}
export function steerSled(match,id,x,z,now){
  const racer=match.racers.find(r=>r.id===id&&r.alive);
  if(!racer)return;
  racer.ax=Number.isFinite(x)?Math.max(-1,Math.min(1,x)):0;
  racer.az=Number.isFinite(z)?Math.max(-2,Math.min(1,z)):0;
  racer.inputAt=now;
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
