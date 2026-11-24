export const santaSize=13;
export const santaCellSize=3.8;
export const santaLimit=180000;
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
const santaBenches=[
  [3,1],[7,1],[11,1],[1,3],[5,3],[9,3],[3,5],[7,5],[11,5],[1,7],
  [5,7],[9,7],[3,9],[7,9],[11,9],[1,11],[3,11],[5,11],[9,11],[11,11]
];
export const santaTasks=[
  ['Wrap a gift','order','Build the gift from the inside out.',['Ribbon','Toy','Paper','Box'],[1,3,2,0]],
  ['Sort the mail','order','Stack these parcels from lightest to heaviest.',['2 kg','9 kg','1 kg','5 kg'],[2,0,3,1]],
  ['Pack the sleigh','order','Load the bags in stop order, last stop first.',['Stop 3','Stop 1','Stop 4','Stop 2'],[2,0,3,1]],
  ['Make cocoa','order','Heat the milk, mix in cocoa, pour, then top it.',['Pour','Add cocoa','Heat milk','Add topping'],[2,1,0,3]],
  ['Build a toy train','order','Assemble nose to tail.',['Guard van','Engine','Passenger car','Coal car'],[1,3,2,0]],
  ['Reset the breakers','toggle','Only turn on lighting and the heater.',['Lights','Bell','Heater','Conveyor'],[0,2]],
  ['Inspect ornaments','toggle','Bag only the ornaments with no defects.',['Intact star','Cracked bell','Scratched globe','Intact snowflake'],[0,3]],
  ['Check reindeer feed','toggle','Pick the two feed ingredients on the label: oats and carrots.',['Hay','Oats','Candy','Carrots'],[1,3]],
  ['Fill the supply crate','toggle','Pack a flathead screwdriver and a spare fuse.',['Wrench','Spare fuse','Tape','Flathead screwdriver'],[1,3]],
  ['Reconnect the tree lights','wire','Match each bulb with its socket color.',['Red bulb','Green bulb','Gold bulb'],[2,0,1],['Green socket','Gold socket','Red socket']],
  ['Route the parcels','wire','Match each address with its destination.',['Frost Lane','Depot Row','Pine Hill'],[1,2,0],['Pine bin','Frost bin','Depot bin']],
  ['Pair the name tags','wire','Match the apprentice with their assigned station.',['Mira · paint','Tess · toys','Noah · mail'],[2,0,1],['Toy bench','Mail desk','Paint booth']],
  ['Patch the radio','wire','Connect antenna to receive, mic to transmit, and battery to power.',['Battery','Antenna','Mic'],[1,2,0],['Transmit','Power','Receive']],
  ['Set the oven','dial','Set the oven to 180°C.',['Oven temperature · °C'],[180],[100,240,10]],
  ['Align the sky chart','dial','Point the chart east. North = 0°, east = 90°.',['Heading · degrees'],[90],[0,270,15]],
  ['Balance the scale','dial','A 7 kg parcel is on one side. Slide the counterweight to balance it.',['Counterweight · kg'],[7],[0,12,1]],
  ['Calibrate the clock','dial','Set the minute hand to 45 minutes.',['Minute hand'],[45],[0,55,5]],
  ['Repeat the bell pattern','memory','Watch the bells, then repeat the order.',['Low','Mid','High'],[0,2,1,0]],
  ['Copy the ribbon code','memory','Memorize the colors on the packing slip.',['Red','Blue','Green','Gold'],[3,1,2,0]],
  ['Enter the stockroom code','memory','Read the digits on the clipboard before they disappear.',['1','2','3','4','5','6'],[4,0,5,2]]
].map(([title,kind,prompt,options,answer,extra],id)=>({id,title,kind,prompt,options,answer,extra,...santaCenter(...santaBenches[id])}));
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
  return {type:'santa',phase:'running',start:now,tick:now,deadline:now+santaLimit,winner:null,santa:santaCenter(11,5),
    racers:ids.map((id,i)=>({id,x:spawn.x+(i%3-1)*.58,z:spawn.z+(Math.floor(i/3)-1)*.55,yaw:spawnYaw,alive:true,seen:now,score:0,tasks:[]}))};
}
function santaRoute(match){
  const players=match.racers.filter(p=>p.alive);
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
  for(const p of match.racers)if(!ids.has(p.id))p.alive=false;
  if(now-match.start>4500){
    let target=match.santaTarget;
    if(!target||Math.hypot(target.x-match.santa.x,target.z-match.santa.z)<.14){
      const next=santaRoute(match);
      match.santaTarget=target=next?{x:next.x,z:next.z}:null;
    }
    if(target){
      const dx=target.x-match.santa.x,dz=target.z-match.santa.z;
      const length=Math.hypot(dx,dz);
      const travel=Math.min(length,Math.min(.24,Math.max(0,(now-match.tick)/1000))*(3.35+(now-match.start)/190000));
      if(length>.01){
        const x=match.santa.x+dx/length*travel,z=match.santa.z+dz/length*travel;
        if(!santaBlocked(x,z,.32)){match.santa.x=x;match.santa.z=z}
        else if(!santaBlocked(x,match.santa.z,.32))match.santa.x=x;
        else if(!santaBlocked(match.santa.x,z,.32))match.santa.z=z;
      }
    }
  }
  match.tick=now;
  for(const p of match.racers){
    if(!p.alive)continue;
    if(Math.hypot(p.x-match.santa.x,p.z-match.santa.z)<.88&&santaClear(p,match.santa)){
      p.alive=false;
    }
  }
  if(now>=match.deadline||!match.racers.some(p=>p.alive)||match.racers.some(p=>p.score===santaTasks.length)){
    match.phase='ended';
    const score=Math.max(0,...match.racers.map(p=>p.score));
    match.winners=match.racers.filter(p=>p.score===score).map(p=>p.id);
    match.winner=match.winners.length===1?match.winners[0]:null;
  }
}
export function updateSantaPlayer(match,id,body,now){
  const p=match.racers.find(r=>r.id===id&&r.alive);
  if(!p||match.phase==='ended')return;
  const x=Number(body.x),z=Number(body.z);
  const max=7.4*Math.min(.6,Math.max(.07,(now-p.seen)/1000))+.16;
  if(Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-p.x,z-p.z)<=max&&santaClear(p,{x,z})){
    p.x=x;p.z=z;
  }
  p.seen=now;
  if(Number.isFinite(body.yaw))p.yaw=body.yaw;
}
export function completeSantaTask(match,id,taskId,response,now){
  const p=match.racers.find(r=>r.id===id);
  const task=Number.isInteger(taskId)?santaTasks[taskId]:null;
  if(match.phase!=='running'||now>=match.deadline||!p?.alive)return 'You can only score while you are in the round.';
  if(!task||Math.hypot(p.x-task.x,p.z-task.z)>1.85)return 'Get closer to the task station.';
  p.tasks??=[];
  if(p.tasks.includes(taskId))return 'Already completed.';
  if(!Array.isArray(response)||response.length!==task.answer.length||!response.every(Number.isInteger))return 'Try again.';
  const answers=task.kind==='toggle'?[...response].sort((a,b)=>a-b):response;
  if(!task.answer.every((value,index)=>value===answers[index]))return 'Try again.';
  p.tasks.push(taskId);
  p.score=p.tasks.length;
  return null;
}
