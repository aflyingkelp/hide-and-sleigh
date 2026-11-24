import * as T from './three.module.js';
import {boxes,props,buildings,trees,lamps,TYPES,blocked,spawn,rocketCooldown,tauntNames,trapBeats,trapWindow,trapDuration} from './world.js';
import {makeSledArena} from './sled.js?v=16';
import {makeSantaMaze} from './santa.js?v=16';
const $=id=>document.getElementById(id),scene=new T.Scene();scene.background=new T.Color('#010205');scene.fog=new T.FogExp2('#010205',.023);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;document.body.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(76,innerWidth/innerHeight,.055,135);camera.rotation.order='YXZ';scene.add(camera);scene.add(new T.HemisphereLight(0x7196c8,0x2b3449,.105));const moon=new T.DirectionalLight(0x8ba9d9,.13);moon.position.set(-30,70,20);scene.add(moon);
const materials=new Map(),geo={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,10,8),cone:new T.ConeGeometry(1,1,10),cylinder:new T.CylinderGeometry(1,1,1,12)};
function material(c){if(!materials.has(c)){const m=new T.MeshStandardMaterial({color:c==='window'?'#ffcf89':c,roughness:.84});materials.set(c,m)}return materials.get(c)}
function mesh(parent,type,x,y,z,w,h,d,c){const m=new T.Mesh(geo[type],material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
// Static architecture uses GPU instancing; the large map stays inexpensive to draw.
const batches=new Map(),architecture=[],matrix=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),scale=new T.Vector3();
const ground=mesh(scene,'box',0,-.3,0,210,.35,210,'#9fb8c7');ground.castShadow=false;
// Small batches let the camera and flashlight skip geometry across town.
for(const box of boxes){
  const key=Math.floor(box.x/27)+','+Math.floor(box.z/27)+','+box.c;
  if(!batches.has(key))batches.set(key,[]);
  batches.get(key).push(box);
}
for(const list of batches.values()){const m=new T.InstancedMesh(geo.box,material(list[0].c),list.length);list.forEach((b,i)=>{q.setFromEuler(new T.Euler(0,0,b.rot||0));matrix.compose(v.set(b.x,b.y,b.z),q,scale.set(b.w,b.h,b.d));m.setMatrixAt(i,matrix)});m.receiveShadow=true;m.castShadow=true;m.computeBoundingSphere();scene.add(m);architecture.push(m)}
function textSign(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#183a34';ctx.fillRect(0,0,512,80);ctx.strokeStyle='#af9564';ctx.lineWidth=5;ctx.strokeRect(3,3,506,74);ctx.fillStyle='#ffe3b3';ctx.font='bold 30px Georgia';ctx.textAlign='center';ctx.fillText(text,256,49);const m=new T.Mesh(new T.PlaneGeometry(5.6,.88),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:1}));m.position.set(x,y,z);scene.add(m)}
for(const b of buildings){textSign(b.name,b.x,2.9,b.z+b.d/2+2.85);const roofpeak=mesh(scene,'box',b.x,4.45,b.z,.35,.2,b.d+2,'#e0e7e7');roofpeak.castShadow=false;for(let i=-b.w/2+1;i<b.w/2;i+=1.5){const bulb=mesh(scene,'sphere',b.x+i,3.5,b.z+b.d/2+.3,.065,.065,.065,'#ffd48e');bulb.material=material(Math.round(i)%2?'#ffcf7e':'#c93d4c')}}
// The model factory is used for both scenery and live player disguises.
function model(p){const g=new T.Group(),c=p.color||'#ad414d';const add=(type,x,y,z,w,h,d,col)=>mesh(g,type,x,y,z,w,h,d,col);
if(p.type==='gift'){add('box',0,.4,0,.8,.8,.8,c);add('box',0,.41,0,.13,.83,.83,'#e4c17b');add('box',0,.83,0,.86,.08,.86,c);add('box',0,.88,0,.9,.04,.14,'#e4c17b')}
else if(p.type==='crate'){add('box',0,.55,0,1,1.1,1,c);for(const a of [-.38,.38]){add('box',a,.55,.52,.1,1.1,.08,'#b99a70');add('box',0,.55+a,.53,1,.08,.1,'#b99a70')}}
else if(p.type==='barrel'){add('cylinder',0,.56,0,.48,1.12,.48,c);for(const y of [.15,.95])add('cylinder',0,y,0,.49,.1,.49,'#374a50')}
else if(p.type==='chair'){add('box',0,.6,0,.8,.12,.8,c);add('box',0,1,-.35,.8,.55,.12,c);for(const x of [-.3,.3])for(const z of [-.3,.3])add('box',x,.3,z,.1,.6,.1,c)}
else if(p.type==='stool'){add('cylinder',0,.6,0,.36,.1,.36,c);for(const x of [-.22,.22])for(const z of [-.22,.22])add('box',x,.3,z,.09,.6,.09,c)}
else if(p.type==='snowman'){add('sphere',0,.48,0,.5,.5,.5,'#dce9e6');add('sphere',0,1.1,0,.35,.35,.35,'#e8eeeb');add('cylinder',0,1.48,0,.43,.07,.43,'#233946');add('cylinder',0,1.66,0,.25,.32,.25,'#233946');add('box',0,1.08,0,.72,.12,.7,'#a63343');for(const x of [-.12,.12])add('sphere',x,1.2,.31,.045,.045,.045,'#192934')}
else if(p.type==='pine'){add('cylinder',0,.22,0,.28,.45,.28,'#946247');for(let i=0;i<3;i++)add('cone',0,.65+i*.4,0,.65-i*.14,.9,.65-i*.14,'#32674f');add('sphere',0,1.8,0,.08,.1,.08,'#e7c476')}
else if(p.type==='lantern'){add('box',0,.28,0,.36,.5,.36,'#dfb769');for(const x of [-.2,.2])for(const z of [-.2,.2])add('box',x,.3,z,.055,.6,.055,'#3b4b45');add('cone',0,.63,0,.34,.2,.34,'#46584d')}
else if(p.type==='sack'){add('sphere',0,.44,0,.45,.48,.4,c);add('cylinder',0,.85,0,.17,.22,.17,c);add('box',0,.85,0,.4,.07,.4,'#d5bb81')}
else if(p.type==='soldier'){add('box',0,.75,0,.45,.6,.3,c);add('sphere',0,1.25,0,.23,.23,.23,'#d6b993');add('cylinder',0,1.5,0,.25,.32,.25,'#273440');for(const x of [-.15,.15])add('box',x,.22,0,.15,.45,.25,'#263b45');add('box',0,.75,.17,.06,.6,.04,'#d4b96f')}
else if(p.type==='books'){for(let i=0;i<4;i++){const b=add('box',0,.06+i*.1,0,.7,.09,.5,i%2?c:'#d0b77f');b.rotation.y=i*.1}}
return g}
const propGroups=[];for(const p of props){const g=model(p);g.position.set(p.x,.1,p.z);g.rotation.y=p.yaw;g.userData.propId=p.id;scene.add(g);propGroups.push(g)}
for(const [x,z,s]of trees){mesh(scene,'cylinder',x,.6,z,.25,1.2,.25,'#604737');for(let i=0;i<3;i++){mesh(scene,'cone',x,1.7*s+i*s,z,(2-i*.4)*s,2.8*s,(2-i*.4)*s,'#224e43');mesh(scene,'cone',x,2.25*s+i*s,z,(1.55-i*.3)*s,1.7*s,(1.55-i*.3)*s,'#a9c5ce')}}
for(const [x,z] of lamps){
  mesh(scene,'cylinder',x,1.8,z,.07,3.6,.07,'#334d56');
  mesh(scene,'box',x,3.5,z,.45,.6,.45,'window');
}
const snow=new Float32Array(2400);for(let i=0;i<snow.length;i+=3){snow[i]=(Math.random()-.5)*90;snow[i+1]=5+Math.random()*15;snow[i+2]=(Math.random()-.5)*90}const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(snow,3));const snowfall=new T.Points(snowGeo,new T.PointsMaterial({color:0x26394d,size:.06,transparent:true,opacity:.2}));scene.add(snowfall);
function makeFlashlight(shadowSize){
  const light=new T.SpotLight(0xe3efff,90,34,Math.PI/7,.62,1.8);
  light.castShadow=true;
  light.shadow.mapSize.set(shadowSize,shadowSize);
  light.shadow.camera.near=.2;
  light.shadow.bias=-.0004;
  return light;
}
const torch=makeFlashlight(1024);torch.position.set(.15,-.12,-.3);const beamTarget=new T.Object3D();beamTarget.position.set(0,0,-15);camera.add(beamTarget,torch);torch.target=beamTarget;const handheld=new T.Group();camera.add(handheld);mesh(handheld,'cylinder',.28,-.28,-.48,.05,.3,.05,'#233d44').rotation.x=Math.PI/2;
const apiOrigin = location.hostname === 'aflyingkelp.github.io'
  ? 'https://hide-and-sleigh-night-house.a-flying-kelp.chatgpt.site'
  : '';
let morphRevision = 0;
let morphPending = false;
let clinging=false;
let rocketReady=0;
let rocketPending=false;
let lastRemoteShot=0;
let position=new T.Vector3(0,.1,12),yaw=Math.PI,pitch=0,mode='menu',session=null,state=null,localProp=-1,battery=100,lightOn=true,stamina=100,crouch=false,keys={},moving=false,paused=false,mapOpen=false,serverOffset=0,lastRound=-1,syncBusy=false,target=null,toastUntil=0,lastTag=0,lastJingle=-1,lastStep=0,audio=null,connected=true;
let nextAimCheck=0;
const remotes=new Map(),ray=new T.Raycaster(),mapCtx=$('map').getContext('2d');let last=performance.now();
function active(){return mode==='explore'||mode==='online'}function me(){return state?.players.find(p=>p.id===session?.id)}function seeker(){return mode==='online'&&state?.room.seeker===session?.id}function caught(){return mode==='online'&&me()?.caught&&['hiding','seeking'].includes(state?.room.phase)}function frozen(){return seeker()&&state?.room.phase==='hiding'}
function toast(text){$('message').textContent=text;toastUntil=performance.now()+2800}
function sound(f=440,d=.15,volume=.04,pan=0){if(!audio)return;const o=audio.createOscillator(),g=audio.createGain(),p=audio.createStereoPanner();o.type=f<150?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);p.pan.value=pan;o.connect(g).connect(p).connect(audio.destination);o.start();o.stop(audio.currentTime+d)}
function initAudio(){
  if(!audio){
    audio=new(window.AudioContext||window.webkitAudioContext)();
    audio.addEventListener('statechange',flushTaunts);
  }
  if(audio.state!=='running')audio.resume().then(flushTaunts).catch(()=>{});
  loadTauntAudio();
}
function unlockGameAudio(event){
  if(event.isTrusted&&active()&&audio?.state!=='running')initAudio();
}
addEventListener('pointerdown',unlockGameAudio,true);
addEventListener('keydown',unlockGameAudio,true);
async function post(action,data={}){const r=await fetch(apiOrigin+'/api/'+action,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...session,...data}),signal:AbortSignal.timeout(7000)});const body=await r.json();if(!r.ok)throw new Error(body.error||'Connection failed');return body}
const viewCanvas=renderer.domElement;
let lockPending=false;
let discardLockSample=false;
let dragPointer=null;
let dragX=0,dragY=0;
let lookX=0,lookY=0;
const dragHint='Drag mouse to look · Q / R turn · Click or Space to fire';
function resetLook(){
  dragPointer=null;
  lookX=lookY=0;
}
function lock(){
  if(!active()||paused||lockPending||document.pointerLockElement===viewCanvas||!viewCanvas.requestPointerLock)return;
  lockPending=true;
  try {
    viewCanvas.requestPointerLock()?.catch(handleLockError);
  } catch {
    handleLockError();
  }
}
function handleLockError(){
  lockPending=false;
  $('lookHint').textContent=dragHint;
}
document.addEventListener('pointerlockerror',handleLockError);
document.addEventListener('pointerlockchange',()=>{
  lockPending=false;
  resetLook();
  discardLockSample=document.pointerLockElement===viewCanvas;
});
function release(){
  resetLook();
  if(document.pointerLockElement===viewCanvas)document.exitPointerLock();
  keys={};
}
async function connect(action){$('error').textContent='';$('create').disabled=$('join').disabled=true;try{initAudio();session=await post(action,{name:$('name').value,code:$('joinCode').value});sessionStorage.setItem('hide-sleigh-session',JSON.stringify(session));mode='online';lastRound=-1;$('menu').style.display='none';$('lobby').style.display='grid';await sync();}catch(e){$('error').textContent=e.message;session=null}finally{$('create').disabled=$('join').disabled=false}}
$('create').onclick=()=>connect('create');$('join').onclick=()=>connect('join');$('joinCode').onkeydown=e=>{if(e.key==='Enter')connect('join')};$('explore').onclick=()=>{initAudio();mode='explore';paused=false;localProp=-1;position.set(0,.1,12);$('menu').style.display='none';lock()};
function lobby(){release();paused=true;$('paused').style.display='none';if(session){$('lobby').style.display='grid';renderLobby()}else $('menu').style.display='grid'}
$('roomButton').onclick=()=>{if(state?.sled||state?.santa){sledLobbyToggle();return}if(!active())return;release();paused=true;$('paused').style.display='grid';$('pauseText').textContent=session?'The online round keeps running while this menu is open.':'Solo exploration paused.'};$('showLobby').onclick=lobby;$('resume').onclick=()=>{$('paused').style.display='none';paused=false;lock()};$('walk').onclick=()=>{$('lobby').style.display='none';paused=false;lock()};
async function leave(){if(session)try{await post('leave')}catch{}session=null;state=null;clearSledHud();sessionStorage.removeItem('hide-sleigh-session');mode='menu';paused=false;setWheel(false,false);setActiveTrap(null);clearTrapMeshes();localProp=-1;clinging=false;rocketReady=0;for(const r of remotes.values())scene.remove(r.group);remotes.clear();release();$('paused').style.display=$('lobby').style.display='none';$('menu').style.display='grid';$('blackout').style.display='none'}$('leave').onclick=leave;$('quit').onclick=leave;
$('copyCode').onclick=async()=>{try{await navigator.clipboard.writeText(session.code);$('copyCode').textContent='Copied';setTimeout(()=>$('copyCode').textContent='Copy code',1500)}catch{$('lobbyError').textContent='Room code: '+session.code}};
$('gameSelect').onchange=()=>{if(state)renderLobby()};
$('begin').onclick=async()=>{try{const game=$('gameSelect').value;if(game!=='hide'){initAudio();await post('start-'+game);await sync();return}await post('start',{seeker:$('seekerSelect').value});$('lobby').style.display='none';paused=false;await sync();lock()}catch(e){$('lobbyError').textContent=e.message}};
function renderLobby(){if(!state||!session)return;const host=state.room.host===session.id;$('code').textContent=session.code;$('lobbyInfo').textContent=state.room.phase==='ended'?(state.room.winner==='seeker'?'The seeker found everyone.':'Hiders survived!')+' Choose the next seeker and play again.':state.room.phase==='lobby'?'Share this code and the game link with your friends.':'Round in progress. New arrivals watch until the next round.';$('roster').replaceChildren();for(const p of state.players){const row=document.createElement('div');row.className='person';const name=document.createElement('span');name.textContent=p.name+(p.id===session.id?' (you)':'');const role=document.createElement('small');role.textContent=p.id===state.room.host?'Host':p.caught?'Watching':'Connected';row.append(name,role);$('roster').append(row)}$('begin').style.display=host?'block':'none';$('gameSelection').hidden=!host;$('seekerLabel').style.display=host&&$('gameSelect').value==='hide'?'grid':'none';$('begin').disabled=state.players.length<2||['hiding','seeking','sled','santa'].includes(state.room.phase);if(state.sled?.phase==='ended'||state.santa?.phase==='ended')renderSledResults();const selected=$('seekerSelect').value;const ids=state.players.map(p=>p.id).join(',');if($('seekerSelect').dataset.ids!==ids){$('seekerSelect').replaceChildren();for(const p of state.players){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;$('seekerSelect').append(option)}$('seekerSelect').dataset.ids=ids;if(state.players.some(p=>p.id===selected))$('seekerSelect').value=selected}}
async function sync(){if(!session||syncBusy)return;syncBusy=true;const revision=morphRevision;try{const inSled=!!state?.sled;const inSanta=!!state?.santa;const requestStart=performance.now();const next=inSanta?await post('santa-sync',{...santaArena?.position(),yaw}):inSled?await post('sled-sync',sledInput()):await post('sync',{x:position.x,z:position.z,yaw,pitch,light:lightOn&&localProp<0});if(next.retry){state=null;lastRound=-1;clearSledHud();return}connected=true;const oneWay=next.sled?Math.min(170,(performance.now()-requestStart)/2):0;const measuredOffset=next.now+oneWay-Date.now();serverOffset=inSled&&next.sled?serverOffset+(measuredOffset-serverOffset)*.17:measuredOffset;const old=state?.room.phase;state=next;if(next.santa){receivedSanta(next);return}if(next.sled){if(inSanta)clearSledHud();receivedSled(next,old);return}if(inSled||inSanta){lastRound=-1;clearSledHud()}const self=me();if(!self)throw new Error('You left this room.');if(lastRound!==state.room.round){lastRound=state.room.round;position.set(self.x,.1,self.z);localProp=self.prop;battery=100;stamina=100;lastJingle=-1;crouch=false;clinging=false;rocketReady=0;lightOn=seeker();if(state.room.round>0){$('lobby').style.display='none';paused=false;toast(seeker()?'YOU ARE THE SEEKER · Wait for the countdown.':'YOU ARE A HIDER · Aim at a prop and press E.')}}else{if(Math.hypot(position.x-self.x,position.z-self.z)>2.2)position.set(self.x,.1,self.z);if(revision===morphRevision&&!morphPending){localProp=self.prop;if(localProp>=0)lightOn=false}}if(state.room.phase==='ended'&&old!=='ended'){setWheel(false,false);release();paused=true;$('lobby').style.display='grid';sound(state.room.winner==='hiders'?660:110,.8)}updateRemotes();syncSoundsAndTraps(next,self);const remoteShot=state.players.find(p=>p.id===state.room.seeker&&p.id!==session.id)?.rocket;if(remoteShot&&remoteShot.time>lastRemoteShot){lastRemoteShot=remoteShot.time;if(next.now-remoteShot.time<1600)animateRocket(remoteShot.start,remoteShot.impact)}if($('lobby').style.display==='grid')renderLobby();$('network').textContent='ROOM '+session.code+' · '+state.players.length+'/10 online';}catch(e){connected=false;$('network').textContent='Connection interrupted · retrying';if(/expired|again|left this room/i.test(e.message)){toast(e.message);leave()}}finally{syncBusy=false}}
setInterval(sync,150);
// A random server-generated player ID picks a consistent picture for every viewer.
const avatarLoader=new T.TextureLoader();
const avatarMaterials=Array.from({length:7},(_,index)=>{
  const atlas=avatarLoader.load(new URL('./avatars/'+(index+1)+'.png',import.meta.url).href);
  atlas.colorSpace=T.SRGBColorSpace;
  return new T.MeshStandardMaterial({map:atlas,alphaTest:.42,side:T.DoubleSide,roughness:.9});
});
const avatarPlane=new T.PlaneGeometry(1.46,2.02);
function avatarIndex(id){
  let hash=0;
  for(const char of id)hash=(Math.imul(hash,31)+char.charCodeAt(0))>>>0;
  return hash%avatarMaterials.length;
}
function character(id){
  const group=new T.Group();
  const portrait=new T.Mesh(avatarPlane,avatarMaterials[avatarIndex(id)]);
  portrait.position.y=1.01;
  portrait.rotation.y=Math.PI;
  portrait.castShadow=true;
  portrait.receiveShadow=true;
  group.add(portrait);
  return group;
}
const remoteLights=new Map();
const beamDirection=new T.Vector3();
const beamRotation=new T.Euler(0,0,0,'YXZ');
function updateRemoteFlashlights(){
  for(const player of state?.players||[]){
    if(player.id===session?.id)continue;
    const remote=remotes.get(player.id);
    if(!remote)continue;
    let beam=remoteLights.get(player.id);
    const enabled=player.light&&!player.caught&&player.prop<0
      && !(state.room.phase==='hiding'&&state.room.seeker===player.id)
      && remote.group.position.distanceTo(position)<47;
    if(!beam&&enabled){
      beam=makeFlashlight(512);
      scene.add(beam,beam.target);
      remoteLights.set(player.id,beam);
    }
    if(!beam)continue;
    beam.visible=enabled;
    if(!enabled)continue;
    beamRotation.set(player.pitch,remote.group.rotation.y,0);
    beamDirection.set(0,0,-1).applyEuler(beamRotation);
    beam.position.copy(remote.group.position).setY(remote.group.position.y+1.6);
    beam.position.addScaledVector(beamDirection,.55);
    beam.target.position.copy(beam.position).addScaledVector(beamDirection,10);
  }
  for(const [id,beam] of remoteLights){
    if(remotes.has(id))continue;
    scene.remove(beam,beam.target);
    beam.shadow.dispose();
    remoteLights.delete(id);
  }
}
function updateRemotes(){const live=new Set();for(const p of state.players){if(p.id===session.id)continue;live.add(p.id);let r=remotes.get(p.id);const kind=p.id===state.room.seeker?'seeker':p.prop>=0?'prop:'+p.prop:'elf';if(!r||r.kind!==kind){if(r)scene.remove(r.group);const g=p.prop>=0&&props[p.prop]?model(props[p.prop]):character(p.id);g.position.set(p.x,.1,p.z);g.userData.playerId=p.id;scene.add(g);r={group:g,kind,target:new T.Vector3(p.x,.1,p.z),yaw:p.yaw};remotes.set(p.id,r)}r.target.set(p.x,.1,p.z);r.yaw=p.yaw;r.group.visible=!p.caught||state.room.phase==='lobby'||state.room.phase==='ended';}for(const [id,r]of remotes)if(!live.has(id)){scene.remove(r.group);remotes.delete(id)}}
function objectId(object,key){let o=object;while(o){if(o.userData[key]!==undefined)return o.userData[key];o=o.parent}return null}
function aim(){if(seeker()){target=null;$('target').style.display='none';return}ray.setFromCamera(new T.Vector2(0,0),camera);ray.far=5.5;const nearby=propGroups.filter((g,i)=>Math.hypot(props[i].x-position.x,props[i].z-position.z)<7);const hits=ray.intersectObjects([...architecture,...nearby,...Array.from(remotes.values(),r=>r.group).filter(g=>g.visible)],true);const hit=hits[0];target=null;if(hit){const propId=objectId(hit.object,'propId'),playerId=objectId(hit.object,'playerId');if(propId!==null)target={propId,label:props[propId].label};else if(playerId!==null)target={playerId}}const canCopy=target?.propId!==undefined&&!seeker()&&!caught();$('target').style.display=canCopy?'block':'none';$('target').textContent=canCopy?'E · Copy '+target.label:'';}
async function copy(un=false){if(!active()||paused||seeker()||caught()||morphPending)return;if(!un)aim();const id=un?-1:target?.propId;if(id===undefined){toast('Aim at a present, chair, barrel, crate, snowman, plant, or other small prop.');return}morphPending=true;++morphRevision;try{if(session){const r=await post('morph',{prop:id});localProp=r.prop}else localProp=id;if(localProp<0)crouch=false;else clinging=false;if(localProp>=0){lightOn=false;sound(520,.2);toast('Copied: '+props[localProp].label+' · X to return')}else toast('Back to normal.')}catch(e){toast(e.message)}finally{++morphRevision;morphPending=false}}
const launcher=new T.Group();
camera.add(launcher);
launcher.position.set(.29,-.26,-.49);
mesh(launcher,'cylinder',0,0,0,.065,.46,.065,'#405c4c').rotation.x=Math.PI/2;
mesh(launcher,'cylinder',0,0,-.22,.084,.05,.084,'#2d373c').rotation.x=Math.PI/2;
mesh(launcher,'box',0,-.085,.085,.065,.14,.08,'#392f2d');
const flyingRockets=[];
const rocketMaterial=new T.MeshBasicMaterial({color:0xf0ae68});
const blastMaterial=new T.MeshBasicMaterial({color:0xffbd79,transparent:true,opacity:.8,depthWrite:false});
function animateRocket(start,impact){
  const from=new T.Vector3(start.x,start.y,start.z);
  const to=new T.Vector3(impact.x,impact.y,impact.z);
  const tracer=new T.Mesh(geo.sphere,rocketMaterial);
  tracer.scale.set(.13,.13,.13);
  tracer.position.copy(from);
  scene.add(tracer);
  flyingRockets.push({from,to,tracer,time:performance.now(),flight:Math.max(65,from.distanceTo(to)*20)});
}
function renderRockets(now){
  for(let i=flyingRockets.length-1;i>=0;i--){
    const shot=flyingRockets[i];
    const age=now-shot.time;
    if(age<shot.flight){shot.tracer.position.lerpVectors(shot.from,shot.to,age/shot.flight);continue}
    if(!shot.blast){
      scene.remove(shot.tracer);
      shot.blast=new T.Mesh(geo.sphere,blastMaterial.clone());
      shot.blast.position.copy(shot.to);
      scene.add(shot.blast);
      const distance=shot.to.distanceTo(position);
      const angle=jingleBearing(shot.to.x,shot.to.z);
      if(distance<48)sound(82,.31,.12*(1-distance/48),Math.sin(angle));
    }
    const fade=(age-shot.flight)/380;
    shot.blast.scale.setScalar(.3+Math.min(1,fade)*2.9);
    shot.blast.material.opacity=.7*(1-Math.min(1,fade));
    if(fade>=1){scene.remove(shot.blast);shot.blast.material.dispose();flyingRockets.splice(i,1)}
  }
}
async function fireRocket(){
  if(!active()||paused||!seeker()||state?.room.phase!=='seeking'||rocketPending||performance.now()<rocketReady)return;
  rocketPending=true;
  try{
    const shot=await post('rocket',{yaw,pitch});
    rocketReady=performance.now()+rocketCooldown;
    animateRocket(shot.start,shot.impact);
    sound(135,.17,.07);
    if(shot.hits.length)toast('FOUND '+shot.hits.join(', ')+'!');
  }catch(e){toast(e.message)}
  finally{rocketPending=false}
}
function toggleCling(){
  if(clinging){clinging=false;toast('Released wall.');return}
  if(!active()||paused||seeker()||caught()||localProp>=0)return;
  const directions=[[0,-1],[1,0],[0,1],[-1,0]];
  for(let distance=.15;distance<=.85;distance+=.1){
    const wall=directions.find(([dx,dz])=>blocked(position.x+dx*distance,position.z+dz*distance));
    if(!wall)continue;
    const [dx,dz]=wall;
    for(let step=.025;step<distance;step+=.025){
      if(blocked(position.x+dx*.025,position.z+dz*.025))break;
      position.x+=dx*.025;
      position.z+=dz*.025;
    }
    clinging=true;
    lightOn=false;
    toast('Clinging to wall · G or Shift to release');
    return;
  }
  toast('Get close to a wall to cling.');
}
$('mobileCopy').onclick=()=>copy();$('mobileTag').onclick=fireRocket;$('mobileCling').onclick=toggleCling;$('mobileLight').onclick=()=>{if(localProp<0)lightOn=!lightOn};
viewCanvas.addEventListener('click',()=>{
  if(state?.sled){deliverGift();return}
  if(state?.santa){if(!sledLobbyOpen)lock();return}
  if(paused||wheelOpen||activeTrap)return;
  lock();
  if(seeker())fireRocket();
});
viewCanvas.addEventListener('pointerdown',event=>{
  if(state?.sled||!active()||paused||document.pointerLockElement===viewCanvas)return;
  dragPointer=event.pointerId;
  dragX=event.clientX;
  dragY=event.clientY;
  viewCanvas.setPointerCapture?.(event.pointerId);
});
function stopDrag(event){
  if(event.pointerId===dragPointer)dragPointer=null;
}
viewCanvas.addEventListener('pointerup',stopDrag);
viewCanvas.addEventListener('pointercancel',stopDrag);
viewCanvas.addEventListener('lostpointercapture',stopDrag);
viewCanvas.addEventListener('pointermove',event=>{
  if(!active()||paused||document.pointerLockElement===viewCanvas||event.pointerId!==dragPointer)return;
  lookX+=event.clientX-dragX;
  lookY+=event.clientY-dragY;
  dragX=event.clientX;
  dragY=event.clientY;
});
document.addEventListener('mousemove',event=>{
  if(!active()||paused||document.pointerLockElement!==viewCanvas)return;
  if(discardLockSample){discardLockSample=false;return}
  // Ignore cursor recenter events that arrive as single, screen-sized jumps.
  if(Math.abs(event.movementX)>300||Math.abs(event.movementY)>300)return;
  lookX+=event.movementX;
  lookY+=event.movementY;
});
function applyMouseLook(dt){
  const blend=1-Math.exp(-dt*85);
  const dx=lookX*blend,dy=lookY*blend;
  lookX-=dx;
  lookY-=dy;
  yaw-=dx*.0023;
  pitch=T.MathUtils.clamp(pitch-dy*.0023,-1.25,1.25);
}
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(document.activeElement?.tagName))return;const k=e.key.toLowerCase();keys[k]=true;if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(e.repeat)return;if(state?.sled||state?.santa){if(k==='escape')sledLobbyToggle();if(k==='f'){if(state.sled)deliverGift();else santaFlash=!santaFlash}return}if(activeTrap){if(k===' ')tapTrap();return}if(wheelOpen){if(k==='escape'||k==='t')setWheel(false);else if(/^[1-8]$/.test(k))sendTaunt(Number(k)-1);return}if(k==='t'){setWheel(true);return}if(k==='b'){placeTrap();return}if(k==='e')copy();if(k==='x')copy(true);if(k==='f'&&localProp<0&&!caught())lightOn=!lightOn;if(k==='c')crouch=!crouch;if(k==='m')mapOpen=!mapOpen;if(k===' ')fireRocket();if(k==='g')toggleCling();if(k==='shift'&&clinging)clinging=false;if(k==='escape'&&active()&&!paused)$('roomButton').click()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);addEventListener('blur',()=>{keys={};resetLook()});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{keys[b.dataset.key]=true;b.setPointerCapture(e.pointerId)};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.key]=false});
const JINGLE_RANGE=50;
let jingleSignal=null;
function jingleBearing(x,z){
  // Zero points straight ahead. Positive angles point to the player's right.
  return Math.atan2(x-position.x,-(z-position.z))+yaw;
}
function playJingle(player,strength,index){
  if(!audio||audio.state!=='running')return;
  const spatial=audio.createPanner();
  spatial.panningModel='HRTF';
  spatial.rolloffFactor=0;
  const angle=jingleBearing(player.x,player.z);
  spatial.positionX.value=Math.sin(angle);
  spatial.positionZ.value=-Math.cos(angle);
  spatial.connect(audio.destination);
  const start=audio.currentTime+index*.11;
  const notes=[];
  for(const [offset,ratio] of [[0,1],[.12,1.33],[.25,1.67]]){
    const oscillator=audio.createOscillator();
    const gain=audio.createGain();
    const at=start+offset;
    oscillator.frequency.value=740*ratio;
    gain.gain.setValueAtTime(.001,at);
    gain.gain.linearRampToValueAtTime(.13*strength,at+.018);
    gain.gain.exponentialRampToValueAtTime(.001,at+.24);
    oscillator.connect(gain).connect(spatial);
    oscillator.start(at);
    oscillator.stop(at+.25);
    notes.push(oscillator);
  }
  notes.at(-1).onended=()=>spatial.disconnect();
}
function ringJingles(time,room){
  const cycle=(time-room.starts-20000)/25000;
  const j=Math.floor(cycle);
  if(j<=lastJingle)return;
  lastJingle=j;
  if(j<1||cycle-j>.08)return;
  if(!seeker()){
    if(!caught()){sound(880,.24,.04);toast('Your bells just rang.')}
    return;
  }
  const audible=state.players.filter(p=>p.id!==room.seeker&&!p.caught)
    .map(p=>({...p,strength:Math.max(0,1-Math.hypot(p.x-position.x,p.z-position.z)/JINGLE_RANGE)**1.45}))
    .filter(p=>p.strength>.025).sort((a,b)=>b.strength-a.strength);
  audible.forEach((p,index)=>playJingle(p,p.strength,index));
  if(audible.length)jingleSignal={...audible[0],until:performance.now()+2600};
}
function updateJingleMeter(now,phase){
  const show=seeker()&&phase==='seeking'&&!paused;
  $('jingleMeter').hidden=!show;
  if(!show){jingleSignal=null;return}
  const signal=jingleSignal?.until>now?jingleSignal:null;
  $('jingleLevel').value=signal?.strength||0;
  $('jingleArrow').hidden=!signal;
  if(!signal){$('jingleDirection').textContent='Listening…';return}
  const degrees=jingleBearing(signal.x,signal.z)*180/Math.PI;
  const sector=((Math.round(degrees/45)%8)+8)%8;
  const directions=['Ahead','Ahead right','Right','Behind right','Behind','Behind left','Left','Ahead left'];
  const range=signal.strength>.57?'Near':signal.strength>.25?'Mid-range':'Far';
  $('jingleArrow').style.transform='rotate('+degrees+'deg)';
  $('jingleDirection').textContent=directions[sector]+' · '+range;
}
function drawMap(){const c=mapCtx,X=x=>(x+105)*720/210,Z=z=>(z+105)*720/210;c.fillStyle='#0a2029ee';c.fillRect(0,0,720,720);c.strokeStyle='#55766d';c.strokeRect(10,10,700,700);c.fillStyle='#25413f';for(const b of buildings){c.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),b.w*720/210,b.d*720/210);c.fillStyle='#c8dbd1';c.font='11px Arial';c.textAlign='center';const words=b.name.split(' ');c.fillText(words.slice(0,-1).join(' '),X(b.x),Z(b.z)-3);c.fillText(words.at(-1),X(b.x),Z(b.z)+10);c.fillStyle='#25413f'}c.fillStyle='#dac48d';c.font='13px Arial';c.fillText('CHRISTMAS SQUARE',360,355);c.fillStyle='#8bffd1';c.beginPath();c.arc(X(position.x),Z(position.z),4,0,7);c.fill();c.strokeStyle='#8bffd1';c.beginPath();c.moveTo(X(position.x),Z(position.z));c.lineTo(X(position.x-Math.sin(yaw)*4),Z(position.z-Math.cos(yaw)*4));c.stroke();c.textAlign='left';c.fillStyle='#c8dbd1';c.fillText('M · CLOSE     /     YOUR POSITION',22,697)}
let wheelOpen=false,activeTrap=null,tauntReady=0,tauntPending=false,trapPending=false;
const tauntBuffers=[];
const queuedTaunts=[];
const tauntMaxAge=7000;
const lastTaunts=new Map(), heardTraps=new Map(), trapMeshes=new Map();
function loadTauntAudio(){
  if(tauntBuffers.length)return;
  for(let i=0;i<tauntNames.length;i++){
    tauntBuffers.push(fetch(new URL('./taunts/'+(i+1)+'.mp3',import.meta.url))
      .then(response=>{if(!response.ok)throw Error('Sound unavailable');return response.arrayBuffer()})
      .then(bytes=>audio.decodeAudioData(bytes))
      .then(buffer=>{
        let peak=.01;
        for(let channel=0;channel<buffer.numberOfChannels;channel++){
          for(const sample of buffer.getChannelData(channel))peak=Math.max(peak,Math.abs(sample));
        }
        return {buffer,clipGain:Math.min(3,.85/peak)};
      }).catch(()=>null));
  }
}
function flushTaunts(){
  if(audio?.state!=='running')return;
  for(const event of queuedTaunts.splice(0))playTaunt(event);
}
async function playTaunt(event){
  const queued=event.received===undefined?{...event,received:performance.now(),room:session?.code}:event;
  if(!active()||queued.room!==session?.code||performance.now()-queued.received>tauntMaxAge)return;
  if(audio?.state!=='running'){
    queuedTaunts.push(queued);
    if(queuedTaunts.length>12)queuedTaunts.shift();
    return;
  }
  loadTauntAudio();
  const decoded=await tauntBuffers[queued.sound];
  if(!decoded||!active()||queued.room!==session?.code||performance.now()-queued.received>tauntMaxAge)return;
  if(audio.state!=='running'){playTaunt(queued);return}
  const distance=Math.hypot(queued.x-position.x,queued.z-position.z);
  const volume=seeker() ? .16+.28/(1+(distance/24)**1.35) : .42*Math.max(0,1-distance/64)**1.4;
  if(!volume)return;
  const {buffer,clipGain}=decoded;
  const clip=audio.createBufferSource(),gain=audio.createGain(),pan=audio.createStereoPanner();
  clip.buffer=buffer;
  gain.gain.value=volume*clipGain;
  pan.pan.value=Math.sin(jingleBearing(queued.x,queued.z))*.85;
  clip.connect(gain).connect(pan).connect(audio.destination);
  clip.start(0,0,Math.min(buffer.duration,4));
}
function setWheel(open,recapture=true){
  if(open&&(!active()||paused||frozen()||caught()||activeTrap||$('lobby').style.display==='grid'))return;
  const changed=wheelOpen!==open;
  wheelOpen=open;
  $('wheelOverlay').classList.toggle('hidden',!open);
  if(open){release();initAudio()}
  else if(changed&&recapture)lock();
}
async function sendTaunt(soundIndex){
  if(!wheelOpen||tauntPending)return;
  if(performance.now()<tauntReady){toast('Taunt is recharging.');return}
  tauntPending=true;
  setWheel(false);
  try{
    const event=session?await post('taunt',{sound:soundIndex}):{sound:soundIndex,x:position.x,z:position.z};
    tauntReady=performance.now()+5000;
    playTaunt(event);
    toast('Taunt · '+tauntNames[soundIndex]);
  }catch(error){toast(error.message)}
  finally{tauntPending=false}
}
tauntNames.forEach((name,i)=>{
  const button=document.createElement('button');
  button.textContent=(i+1)+' · '+name;
  button.onclick=()=>sendTaunt(i);
  $('tauntWheel').append(button);
});
$('closeWheel').onclick=()=>setWheel(false);
$('mobileTaunt').onclick=()=>setWheel(true);
async function placeTrap(){
  if(!seeker()||state?.room.phase!=='seeking'||trapPending||paused)return;
  trapPending=true;
  try{await post('place-trap');toast('Trap placed.');sync()}
  catch(error){toast(error.message)}
  finally{trapPending=false}
}
$('mobileTrap').onclick=placeTrap;
for(const time of trapBeats){
  const zone=document.createElement('span');
  zone.style.left=((time-trapWindow)/trapDuration*100)+'%';
  zone.style.width=(2*trapWindow/trapDuration*100)+'%';
  $('timingZones').append(zone);
}
function clearTrapMeshes(){
  for(const mesh of trapMeshes.values())scene.remove(mesh);
  trapMeshes.clear();
  lastTaunts.clear();
 queuedTaunts.length=0;
  heardTraps.clear();
}
function setActiveTrap(trap){
  if(trap?.id===activeTrap?.id)return;
  activeTrap=trap?{...trap,taps:[],submitted:false}:null;
  $('trapOverlay').classList.toggle('hidden',!activeTrap);
  if(activeTrap){
    setWheel(false,false);
    release();
    $('paused').style.display='none';
    paused=false;
  }
}
function playTrapNoise(trap,loud){
  const distance=Math.hypot(position.x-trap.x,position.z-trap.z);
  const range=loud?85:17;
  if(distance>=range)return;
  const strength=(1-distance/range)**1.3;
  const pan=Math.sin(jingleBearing(trap.x,trap.z));
  if(loud){
    sound(122,.55,.28*strength,pan);
    sound(368,.34,.16*strength,pan);
    sound(920,.26,.11*strength,pan);
  }else sound(470,.16,.045*strength,pan);
}
function syncSoundsAndTraps(next,self){
  for(const player of next.players){
    const event=player.taunt;
    if(player.id!==self.id&&event&&event.time>(lastTaunts.get(player.id)||0)){
      lastTaunts.set(player.id,event.time);
      if(next.now-event.time<tauntMaxAge)playTaunt(event);
    }
  }
  const traps=next.traps||[];
  const armed=new Set();
  let ownTrap=null;
  for(const trap of traps){
    if(!trap.triggered){
      armed.add(trap.id);
      if(!trapMeshes.has(trap.id)){
        const group=new T.Group();
        mesh(group,'cylinder',0,.17,0,.47,.10,.47,'#6b4b40');
        mesh(group,'cylinder',0,.231,0,.17,.07,.17,'#a9504b');
        group.position.set(trap.x,0,trap.z);
        scene.add(group);
        trapMeshes.set(trap.id,group);
      }
      continue;
    }
    const previous=heardTraps.get(trap.id);
    if(!previous&&next.now-trap.triggered<1500)playTrapNoise(trap,false);
    if(trap.result==='fail'&&previous!=='fail'&&next.now-trap.resolved<1500)playTrapNoise(trap,true);
    heardTraps.set(trap.id,trap.result||'triggered');
    if(trap.yours&&!trap.result&&!self.caught)ownTrap=trap;
  }
  for(const [id,model] of trapMeshes)if(!armed.has(id)){scene.remove(model);trapMeshes.delete(id)}
  if(ownTrap&&activeTrap?.id!==ownTrap.id)position.set(self.x,.1,self.z);
  setActiveTrap(ownTrap);
}
async function sendTrapResult(){
  const trap=activeTrap;
  if(!trap||trap.submitted)return;
  trap.submitted=true;
  try{
    const result=await post('trap-result',{trap:trap.id,taps:trap.taps});
    toast(result.passed?'Escaped the trap.':'The trap made a loud clang!');
    sync();
  }catch(error){
    if(activeTrap===trap)trap.submitted=false;
    toast(error.message);
  }
}
function tapTrap(){
  if(!activeTrap||activeTrap.submitted)return;
  const elapsed=Date.now()+serverOffset-activeTrap.triggered;
  if(elapsed<0)return;
  const beat=trapBeats[activeTrap.taps.length];
  activeTrap.taps.push(elapsed);
  sound(510,.09,.025);
  if(Math.abs(elapsed-beat)>trapWindow||activeTrap.taps.length===trapBeats.length)sendTrapResult();
}
$('trapTap').onclick=tapTrap;
function updateTrapChallenge(){
  if(!activeTrap)return;
  const elapsed=Date.now()+serverOffset-activeTrap.triggered;
  $('timingCursor').style.left=Math.max(0,Math.min(99.5,elapsed/trapDuration*100))+'%';
  $('trapProgress').textContent=activeTrap.submitted?'Checking…':elapsed<0?'Get ready…':activeTrap.taps.length+' / '+trapBeats.length+' beats';
  if(!activeTrap.submitted&&elapsed>trapBeats[activeTrap.taps.length]+trapWindow)sendTrapResult();
}
let sledArena=null,santaArena=null,santaPhaseKey=null,santaFlash=true,santaPulse=0;
let sledNotice='',sledNoticeUntil=0,deliveryBusy=false;
let sledPhase=null;
let sledLobbyOpen=false;
const hideHud=['hud','crosshair','target','jingleMeter','equipment','bottom','mobile','map','blackout'];
async function deliverGift(){
  if(state?.sled?.phase!=='rush'||sledLobbyOpen||deliveryBusy)return;
  const self=state.sled.racers.find(p=>p.id===session.id);
  if(!self?.alive||!self.gift)return;
  deliveryBusy=true;
  try{
    await post('sled-deliver');
    sledNotice='Gift delivered · Get clear';
    sound(670,.18,.07);
    sync();
  }catch(error){sledNotice=error.message}
  finally{sledNoticeUntil=performance.now()+1250;deliveryBusy=false}
}
$('sledDeliver').onclick=deliverGift;
function receivedSanta(next){
  const game=next.santa;
  if(santaPhaseKey!==game.start){
    clearSledHud();
    santaPhaseKey=game.start;
    release();
    setWheel(false,false);
    setActiveTrap(null);
    paused=false;
    yaw=Math.PI;pitch=0;santaFlash=true;
    $('paused').style.display='none';
    $('lobby').style.display='none';
    for(const id of hideHud)$(id).classList.add('hidden');
    $('roomButton').textContent='Room';
  }
  santaArena??=makeSantaMaze(character);
  santaArena.receive(game,session.id);
  if(game.phase==='ended'&&!sledLobbyOpen){release();sledLobbyOpen=true;$('lobby').style.display='grid'}
  if(sledLobbyOpen)renderLobby();
}
function drawSanta(dt){
  const game=state.santa,self=game.racers.find(p=>p.id===session.id);
  const alive=self?.alive&&!self?.escaped;
  const moving=alive&&!sledLobbyOpen&&game.phase==='running';
  if(moving){
    applyMouseLook(dt);
    if(keys.q||keys.arrowleft)yaw+=dt*1.6;
    if(keys.r||keys.arrowright)yaw-=dt*1.6;
  }
  const heard=santaArena.draw(renderer,game,session.id,dt,{yaw,pitch},moving?keys:{},santaFlash);
  const remaining=Math.ceil(Math.max(0,game.deadline-Date.now()-serverOffset)/1000);
  const fuses=game.fuses.filter(item=>item.found).length;
  $('santaHud').hidden=false;
  $('sledTouch').hidden=!moving;
  $('sledDeliver').hidden=true;
  $('santaTimer').textContent=game.phase==='ended'?'ROUND OVER':remaining+'s';
  $('santaStatus').textContent=self?.escaped?'Escaped · 10 points':!alive?'Spectating':fuses===game.fuses.length?'Exit unlocked · Find the green door':fuses+' / '+game.fuses.length+' fuses · Stay away from Santa';
  santaPulse-=dt;
  if(moving&&heard<10&&santaPulse<=0){
    santaPulse=.35+heard*.1;
    sound(66,.14,.1*(1-heard/11));
  }
}
function sledInput(){
  if(sledLobbyOpen)return {ax:0,az:0};
  const throttle=!!(keys.w||keys.arrowup);
  const brake=!!(keys.s||keys.arrowdown);
  return {
    ax:Number(!!(keys.d||keys.arrowright))-Number(!!(keys.a||keys.arrowleft)),
    az:brake?1:throttle?keys.shift?-2:-1:0
  };
}
function clearSledHud(){
  for(const id of hideHud)$(id).classList.remove('hidden');
  $('sledHud').hidden=$('sledTouch').hidden=$('sledNav').hidden=$('santaHud').hidden=true;
  santaPhaseKey=null;
  $('roomButton').textContent='Room / Pause';
  sledPhase=null;
  sledLobbyOpen=false;
}
function sledLobbyToggle(){
  if(!state?.sled&&!state?.santa)return;
  if(state?.santa)release();
  sledLobbyOpen=!sledLobbyOpen;
  keys={};
  $('lobby').style.display=sledLobbyOpen?'grid':'none';
  if(sledLobbyOpen)renderLobby();
}
function renderSledResults(){
  const match=state.sled||state.santa;
  const winner=state.players.find(p=>p.id===match.winner);
  $('lobbyInfo').textContent=state.santa?(winner?winner.name+' reached the exit first.':'Nobody escaped the workshop.'):(winner?winner.name+' won Sled Scramble.':'Everybody blew up. No winner.');
  $('roster').replaceChildren();
  for(const racer of [...match.racers].sort((a,b)=>b.score-a.score)){
    const row=document.createElement('div');
    row.className='person';
    const name=document.createElement('span');
    name.textContent=state.players.find(p=>p.id===racer.id)?.name||'Disconnected racer';
    const points=document.createElement('small');
    points.textContent=racer.score+' / 10';
    row.append(name,points);
    $('roster').append(row);
  }
}
function receivedSled(next){
  const phase=next.sled.phase;
  const entering=sledPhase===null||(sledPhase==='ended'&&phase==='lap');
  if(entering){
    release();
    setWheel(false,false);
    setActiveTrap(null);
    $('paused').style.display='none';
    $('lobby').style.display='none';
    sledLobbyOpen=false;
    for(const id of hideHud)$(id).classList.add('hidden');
    $('roomButton').textContent='Room';
  }
  if(phase!==sledPhase){
    if(phase==='rush')sound(610,.3,.1);
    if(phase==='blast')sound(72,.52,.2);
    if(phase==='ended'){
      release();
      sledLobbyOpen=true;
      $('lobby').style.display='grid';
    }
    sledPhase=phase;
  }
  if(sledLobbyOpen)renderLobby();
}
function drawSled(dt){
  const game=state.sled;
  const self=game.racers.find(r=>r.id===session.id);
  const serverNow=Date.now()+serverOffset;
  const seconds=Math.max(0,(game.deadline-serverNow)/1000);
  $('sledHud').hidden=false;
  $('sledTouch').hidden=!['lap','rush'].includes(game.phase)||!self?.alive||sledLobbyOpen;
  $('sledDeliver').hidden=game.phase!=='rush'||!self?.gift;
  $('sledTimer').textContent=game.phase==='rush'?seconds.toFixed(1):game.phase==='lap'?Math.ceil(seconds):game.phase==='blast'?'BOOM':'ROUND OVER';
  const alive=game.racers.filter(r=>r.alive).length;
  const receivers=game.receivers.filter(r=>!r.claim).length;
  const instruction=game.phase==='lap'?'Drive the ring · the center is still hollow'
    :game.phase==='blast'?alive+' left after the blast.'
    :game.phase==='ended'?(game.winner===session.id?'You won!':'See the final scores in the room.')
    :!self?.alive?'Spectating · '+alive+' sleds left'
    :self.gift?receivers+' green receivers left · F or click to deliver'
    :'Gift delivered · Get clear of every gift';
  $('sledStatus').textContent='Heat '+game.heat+' · '+(performance.now()<sledNoticeUntil?sledNotice:instruction);
  sledArena??=makeSledArena(character);
  const view=sledArena.draw(renderer,game,session.id,serverNow,dt,sledInput());
  const speed=view?Math.round(view.speed*3.6):0;
  $('sledSpeed').textContent=speed+' km/h';
  $('sledNav').hidden=!view?.target||!self?.alive;
  if(view?.target){
    const turn=view.bearing;
    $('sledArrow').style.transform='rotate('+(turn*180/Math.PI)+'deg)';
    $('sledDirection').textContent=Math.abs(turn)<.3?'Receiver ahead':Math.abs(turn)>2.55?'Receiver behind':turn<0?'Receiver left':'Receiver right';
  }
}
document.querySelectorAll('[data-sled-key]').forEach(button=>{
  const key=button.dataset.sledKey;
  button.addEventListener('pointerdown',event=>{keys[key]=true;button.setPointerCapture(event.pointerId)});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys[key]=false);
});
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(state?.santa){drawSanta(dt);return}if(state?.sled){drawSled(dt);return}const playing=active()&&!paused&&!frozen()&&!wheelOpen&&!activeTrap;moving=false;let sprint=false;
if(playing){applyMouseLook(dt);if(keys.q||keys.arrowleft)yaw+=dt*1.6;if(keys.r||keys.arrowright)yaw-=dt*1.6;const x=(keys.d?1:0)-(keys.a?1:0),z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);moving=!!(x||z)&&!clinging;sprint=moving&&keys.shift&&stamina>3&&localProp<0;if(sprint)crouch=false;if(moving&&!clinging){const n=Math.hypot(x,z),speed=(sprint?7:crouch?2.2:localProp>=0?3.4:4.5)*dt,dx=(x*Math.cos(yaw)+z*Math.sin(yaw))/n*speed,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))/n*speed,r=localProp>=0?props[localProp].r:.32;if(!blocked(position.x+dx,position.z,r))position.x+=dx;if(!blocked(position.x,position.z+dz,r))position.z+=dz;if(localProp<0&&now-lastStep>(sprint?280:470)){lastStep=now;sound(75+Math.random()*30,.07,crouch?.006:.02)}}stamina=T.MathUtils.clamp(stamina+(sprint?-24:16)*dt,0,100);if(lightOn&&localProp<0&&!frozen()&&!caught()){battery=Math.max(0,battery-dt*.32);if(!battery)lightOn=false}if(!lightOn)battery=Math.min(100,battery+dt*.1)}
const eye=localProp>=0?Math.max(.4,props[localProp].h*.88):clinging?1.38:crouch?1.05:1.72;camera.position.set(position.x,position.y+eye+(moving?Math.sin(now*(sprint?.015:.01))*.025:0),position.z);camera.rotation.set(pitch,yaw,clinging?.065:0);
if(caught()||seeker()||localProp>=0)clinging=false;
launcher.visible=seeker()&&state?.room.phase==='seeking';
launcher.position.z=-.49+Math.max(0,(rocketReady-now-2040)/360)*.115;
$('rocketHud').hidden=!launcher.visible;
$('trapStock').hidden=!launcher.visible;
$('trapStock').textContent='B · Place trap  '+(5-(state?.traps||[]).filter(t=>!t.triggered).length)+'/5 slots';
$('rocketStatus').textContent=rocketPending?'Firing…':now<rocketReady?'Recharging · '+((rocketReady-now)/1000).toFixed(1)+'s':'Ready · Click or Space';
renderRockets(now);
updateTrapChallenge();
torch.visible=active()&&lightOn&&localProp<0&&battery>0&&!caught()&&!frozen();handheld.visible=active()&&localProp<0&&!caught()&&!launcher.visible;handheld.position.y=moving?Math.sin(now*.01)*.01:0;
for(const r of remotes.values()){r.group.position.lerp(r.target,1-Math.exp(-dt*13));const turn=r.yaw-r.group.rotation.y;r.group.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*12))}for(let i=0;i<propGroups.length;i++)propGroups[i].visible=Math.hypot(props[i].x-position.x,props[i].z-position.z)<58;
updateRemoteFlashlights();const building=buildings.find(b=>Math.abs(position.x-b.x)<b.w/2&&Math.abs(position.z-b.z)<b.d/2);$('location').textContent=building?.name.toUpperCase()||'SNOWFALL VILLAGE';
if(active()&&!paused&&!frozen()&&!seeker()){if(now>=nextAimCheck){nextAimCheck=now+65;aim()}}else $('target').style.display='none';$('battery').textContent=(lightOn&&localProp<0?'ON':'OFF')+' · '+Math.ceil(battery)+'%';$('stamina').style.width=stamina+'%';$('map').style.display=mapOpen&&active()&&!frozen()?'block':'none';if(mapOpen)drawMap();
const room=state?.room,phase=room?.phase;let info='Explore solo',sub='24 buildings · 96 rooms';if(mode==='online'&&room){const time=Date.now()+serverOffset,seconds=Math.max(0,Math.ceil(((phase==='hiding'?room.starts+20000:room.starts+200000)-time)/1000));info=phase==='lobby'?'Waiting for friends':phase==='ended'?'Round complete':phase==='hiding'?'Hide! '+seconds:Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');sub=phase==='lobby'?'Host starts the round':caught()?'CAUGHT · Watching until next round':seeker()?'SEEKER · '+state.players.filter(p=>p.id!==session.id&&!p.caught).length+' hiders remain':'HIDER · '+(localProp>=0?props[localProp].label:'Find an object to copy');
if(phase==='seeking')ringJingles(time,room);}
updateJingleMeter(now,phase);
$('status').replaceChildren();const big=document.createElement('span');big.textContent=info;const small=document.createElement('small');small.textContent=sub;$('status').append(big,small);$('blackout').style.display=frozen()&&!paused?'grid':'none';if(frozen())$('hideCountdown').textContent='You are the seeker. Searching starts in '+Math.max(0,Math.ceil((room.starts+20000-Date.now()-serverOffset)/1000))+' seconds.';
if(now>toastUntil)$('message').textContent=!active()?'':caught()?'You were found. Explore while the remaining hiders play.':localProp>=0?'YOU ARE A '+props[localProp].label.toUpperCase()+' · Move carefully · X to return':seeker()?'Click or Space to fire · Blast tags nearby hiders':mode==='online'&&phase==='lobby'?'Share the room code. Copy props while you wait.':clinging?'Clinging · G or Shift to release':'E to copy a prop · G to cling to a wall';
for(let i=1;i<snow.length;i+=3){snow[i]-=dt*.8;if(snow[i]<4.8)snow[i]=20}snowGeo.attributes.position.needsUpdate=true;snowfall.position.set(Math.floor(position.x/20)*20,0,Math.floor(position.z/20)*20);renderer.render(scene,camera)}
requestAnimationFrame(frame);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
try{const saved=JSON.parse(sessionStorage.getItem('hide-sleigh-session'));if(saved?.token){session=saved;mode='online';$('menu').style.display='none';$('lobby').style.display='grid';sync()}}catch{}

