import * as T from './three.module.js';
import {santaMaze,santaCellSize,santaTasks,santaBlocked} from './santa-rules.js?v=18';

export function makeSantaMaze(makeAvatar){
  const scene=new T.Scene();
  scene.background=new T.Color('#15101b');scene.fog=new T.FogExp2('#15101b',.051);
  const camera=new T.PerspectiveCamera(72,innerWidth/innerHeight,.045,76);
  camera.rotation.order='YXZ';scene.add(camera);
  scene.add(new T.HemisphereLight(0xe1bcaa,0x604b69,.78));
  const unit=new T.BoxGeometry(1,1,1);
  const mats=new Map();
  function mat(color){
    if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.91}));
    return mats.get(color);
  }
  function block(w,h,d,c,x,y,z,parent=scene){
    const object=new T.Mesh(unit,mat(c));
    object.scale.set(w,h,d);object.position.set(x,y,z);parent.add(object);return object;
  }
  const size=santaMaze.length*santaCellSize;
  block(size,.2,size,'#544139',size/2,-.11,size/2);
  block(size,.24,size,'#271e32',size/2,3.45,size/2);
  const walls=[],trim=[];
  for(let z=0;z<santaMaze.length;z++)for(let x=0;x<santaMaze.length;x++){
    const px=(x+.5)*santaCellSize,pz=(z+.5)*santaCellSize;
    if(santaMaze[z][x]){
      walls.push([px,1.65,pz,santaCellSize,3.3,santaCellSize]);
      trim.push([px,.13,pz,santaCellSize+.035,.24,santaCellSize+.035]);
      trim.push([px,2.85,pz,santaCellSize+.035,.13,santaCellSize+.035]);
    }else if((x*3+z*7)%5===0){
      block(1.5,.045,.29,'#96736d',px,3.24,pz).material=new T.MeshBasicMaterial({color:'#be936e'});
      block(1.12,.028,1.22,'#784b50',px,.013,pz);
    }
  }
  const matrix=new T.Matrix4();
  for(const [items,color] of [[walls,'#aa8c67'],[trim,'#513949']]){
    const batch=new T.InstancedMesh(unit,mat(color),items.length);
    items.forEach(([x,y,z,w,h,d],i)=>{matrix.makeScale(w,h,d);matrix.setPosition(x,y,z);batch.setMatrixAt(i,matrix)});
    scene.add(batch);
  }
  const light=new T.SpotLight(0xffe5ca,15,18,Math.PI/5,.45,1.6);
  light.position.set(.18,-.15,-.28);
  light.target.position.set(0,0,-10);
  camera.add(light,light.target);
  const image=new T.TextureLoader().load(new URL('./santa-art/hunter.png',import.meta.url).href);
  image.colorSpace=T.SRGBColorSpace;
  const santa=new T.Sprite(new T.SpriteMaterial({map:image,depthTest:true,alphaTest:.4,color:'#ffdfd9'}));
  santa.scale.set(1.5,2.8,1);scene.add(santa);
  const readyLight=new T.MeshBasicMaterial({color:0x83edff});
  const doneLight=new T.MeshBasicMaterial({color:0x57936d});
  const palette={order:'#937458',toggle:'#66725e',wire:'#705e83',dial:'#6c768e',memory:'#915f65'};
  const stations=santaTasks.map(task=>{
    block(.9,.20,.68,palette[task.kind],task.x,.73,task.z);
    block(.56,.72,.52,'#45323f',task.x,.36,task.z);
    block(.64,.31,.36,palette[task.kind],task.x,1.0,task.z);
    const indicator=block(.23,.10,.16,'#72dbed',task.x,1.18,task.z);
    indicator.material=readyLight;
    return indicator;
  });
  const remote=new Map();
  let resetKey=null,position={x:0,z:0},started=false;
  function receive(game,id){
    const self=game.racers.find(p=>p.id===id);
    if(resetKey!==game.start){
      resetKey=game.start;
      position={x:self?.x??5.7,z:self?.z??5.7};
      santa.position.set(game.santa.x,1.4,game.santa.z);
      started=true;
    }else if(self?.alive&&Math.hypot(self.x-position.x,self.z-position.z)>2.4)position={x:self.x,z:self.z};
  }
  function draw(renderer,game,id,dt,look,keys,flash){
    const self=game.racers.find(p=>p.id===id);
    const observer=self?.alive?self:game.racers.find(p=>p.alive);
    if(observer?.id===id&&started&&game.phase==='running'){
      const moveX=Number(!!keys.d)-Number(!!keys.a),moveZ=Number(!!keys.s)-Number(!!keys.w);
      const step=(keys.shift?6.8:4.8)*dt/Math.max(1,Math.hypot(moveX,moveZ));
      const dx=(moveX*Math.cos(look.yaw)+moveZ*Math.sin(look.yaw))*step;
      const dz=(moveZ*Math.cos(look.yaw)-moveX*Math.sin(look.yaw))*step;
      if(!santaBlocked(position.x+dx,position.z))position.x+=dx;
      if(!santaBlocked(position.x,position.z+dz))position.z+=dz;
    }
    const view=observer&&observer.id!==id?observer:position;
    camera.position.set(view.x,1.63,view.z);
    camera.rotation.set(observer?.id!==id&&observer?0:look.pitch,observer?.id!==id&&observer?observer.yaw:look.yaw,0);
    if(camera.aspect!==innerWidth/innerHeight){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
    light.visible=flash;
    for(const [i,station] of stations.entries())station.material=self?.tasks?.includes(i)?doneLight:readyLight;
    const easing=1-Math.exp(-dt*13);
    santa.position.x+=(game.santa.x-santa.position.x)*easing;
    santa.position.z+=(game.santa.z-santa.position.z)*easing;
    for(const p of game.racers){
      if(p.id===id)continue;
      if(!remote.has(p.id)){const art=makeAvatar(p.id);art.position.set(p.x,0,p.z);scene.add(art);remote.set(p.id,art)}
      const art=remote.get(p.id);
      art.visible=p.alive&&p.id!==observer?.id;
      art.position.x+=(p.x-art.position.x)*easing;
      art.position.z+=(p.z-art.position.z)*easing;
      art.rotation.y=p.yaw;
    }
    for(const [id,art] of remote)if(!game.racers.some(p=>p.id===id)){scene.remove(art);remote.delete(id)}
    renderer.render(scene,camera);
    let task=null,best=1.72;
    if(self?.alive)for(const item of santaTasks){
      const distance=Math.hypot(view.x-item.x,view.z-item.z);
      if(distance<best&&!self.tasks?.includes(item.id)){best=distance;task=item}
    }
    return {distance:Math.hypot(view.x-game.santa.x,view.z-game.santa.z),task};
  }
  return {receive,draw,position:()=>position};
}
