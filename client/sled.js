import * as T from './three.module.js';
import {sledOuter,sledInner,sledRadius,sledRush,sledBlast} from './sled-rules.js';

export function makeSledArena(makeAvatar){
  const scene=new T.Scene();
  scene.background=new T.Color('#091726');
  scene.add(new T.HemisphereLight(0xd4f4ff,0x577399,2.1));
  const sky=new T.DirectionalLight(0xd1eaff,2.5);
  sky.position.set(-18,24,16);scene.add(sky);
  const camera=new T.OrthographicCamera(-26,26,25,-25,.1,150);
  camera.position.set(0,46,29);camera.lookAt(0,0,0);
  const solid=color=>new T.MeshStandardMaterial({color,roughness:.82});
  function mesh(geometry,material,parent,x=0,y=0,z=0){
    const item=new T.Mesh(geometry,material);
    item.position.set(x,y,z);parent.add(item);return item;
  }
  function box(w,h,d,color,parent,x=0,y=0,z=0){
    return mesh(new T.BoxGeometry(w,h,d),solid(color),parent,x,y,z);
  }
  function disc(geometry,material,parent,y){
    const item=mesh(geometry,material,parent,0,y,0);
    item.rotation.x=-Math.PI/2;return item;
  }
  const lake=disc(new T.CircleGeometry(30,72),solid('#11283b'),scene,-1);
  const ring=disc(new T.RingGeometry(sledInner,sledOuter,80),solid('#75a9be'),scene,0);
  const center=disc(new T.CircleGeometry(sledInner+.02,80),solid('#507e9c'),scene,0);
  const freezeLines=new T.Group();scene.add(freezeLines);
  for(let i=0;i<15;i++){
    const a=i*2.399, r=2+(i%5)*1.49;
    const scratch=box(1.5+i%4,.014,.045,'#82b9c8',freezeLines,Math.cos(a)*r,.019,Math.sin(a)*r);
    scratch.rotation.y=a*.61;
  }
  disc(new T.RingGeometry(sledInner-.02,sledInner+.13,80),solid('#c6e6fb'),scene,.023);
  disc(new T.RingGeometry(14.9,15.04,80),solid('#a4d1e4'),scene,.017);
  const wall=new T.Group();scene.add(wall);
  const blocks=56;
  for(let i=0;i<blocks;i++){
    const a=i*Math.PI*2/blocks;
    const panel=new T.Group();
    panel.position.set(Math.sin(a)*sledOuter,0,Math.cos(a)*sledOuter);
    panel.rotation.y=a;wall.add(panel);
    box(2.18,1.35,.62,i%2?'#294d69':'#416883',panel,0,.66,0);
    box(2.18,.16,.7,'#d0e7ef',panel,0,1.42,0);
    if(i%7===0)box(.23,.29,.28,'#fc616f',panel,0,1.63,0);
  }
  const sleds=new Map();
  function gift(parent,x,y,z){
    const present=new T.Group();
    present.position.set(x,y,z);parent.add(present);
    box(.62,.5,.57,'#b52c53',present,0,.25);
    box(.13,.51,.58,'#ffcf6e',present,0,.25);
    box(.63,.06,.14,'#ffcf6e',present,0,.51);
    return present;
  }
  function rider(id,local){
    const root=new T.Group();scene.add(root);
    box(1.16,.21,1.91,local?'#b44c58':'#294c65',root,0,.26);
    for(const x of [-.43,.43]){
      box(.13,.12,2.07,'#d1eaf7',root,x,.06);
      box(.15,.27,.13,'#84b0c6',root,x,.17,-.65);
      box(.15,.27,.13,'#84b0c6',root,x,.17,.65);
    }
    const avatar=makeAvatar(id);
    avatar.position.set(0,.38,.24);avatar.scale.setScalar(1.04);root.add(avatar);
    const parcel=gift(root,0,.37,-.57);
    const under=local?disc(new T.RingGeometry(.96,1.09,24),new T.MeshBasicMaterial({color:0xffd483}),root,.025):null;
    const entry={root,parcel,under};
    sleds.set(id,entry);return entry;
  }
  let receiverModels=[],blastModels=[],key='';
  function rebuild(match){
    for(const item of [...receiverModels,...blastModels])scene.remove(item.root||item);
    blastModels=[];
    receiverModels=match.receivers.map((r,index)=>{
      const root=new T.Group();
      root.position.set(r.x,0,r.z);scene.add(root);
      disc(new T.RingGeometry(.78,1.36,22),new T.MeshBasicMaterial({color:0x65ec9e}),root,.037);
      const receiver=makeAvatar('receiver-'+index);
      receiver.rotation.y=Math.PI;
      receiver.scale.setScalar(.85);root.add(receiver);
      const parcel=gift(root,0,.12,.75);
      const marker=new T.Group();root.add(marker);
      const green=new T.MeshBasicMaterial({color:0x58ff9b});
      const arrow=mesh(new T.ConeGeometry(.46,.64,4),green,marker,0,2.58,0);
      arrow.rotation.z=Math.PI;
      mesh(new T.BoxGeometry(.27,.75,.27),green,marker,0,3.13,0);
      return {root,marker,parcel,ring:root.children[0]};
    });
  }
  function draw(renderer,match,self,serverNow,dt){
    const aspect=innerWidth/innerHeight;
    const height=Math.max(21,23/aspect),width=height*aspect;
    camera.left=-width;camera.right=width;camera.top=Math.max(22,height);camera.bottom=-camera.top;
    camera.updateProjectionMatrix();
    const renderKey=match.heat+':'+match.receivers.map(r=>r.x+','+r.z).join(';');
    if(renderKey!==key){key=renderKey;rebuild(match)}
    center.visible=freezeLines.visible=match.phase!=='lap';
    const inBlast=['blast','ended'].includes(match.phase);
    for(const [index,model] of receiverModels.entries()){
      const claim=match.receivers[index].claim;
      model.root.visible=center.visible;
      model.marker.visible=!claim&&!inBlast;
      model.marker.position.y=.14*Math.sin(serverNow*.008+index);
      model.parcel.visible=!!claim&&!inBlast;
      model.ring.material.color.setHex(claim?0xff646b:0x65ec9e);
    }
    for(const r of match.racers){
      const entry=sleds.get(r.id)||rider(r.id,r.id===self);
      const alpha=1-Math.exp(-dt*15);
      if(!entry.heat||entry.heat!==match.heat){entry.root.position.set(r.x,0,r.z);entry.root.rotation.y=r.yaw;entry.heat=match.heat}
      const drift=match.phase==='lap'||match.phase==='rush'?Math.min(.12,Math.max(0,(serverNow-match.tick)/1000)):0;
      entry.root.position.x+=(r.x+r.vx*drift-entry.root.position.x)*alpha;
      entry.root.position.z+=(r.z+r.vz*drift-entry.root.position.z)*alpha;
      const turn=r.yaw-entry.root.rotation.y;
      entry.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*alpha;
      entry.root.visible=r.alive;
      entry.parcel.visible=r.gift&&!inBlast;
    }
    for(const [id,entry] of sleds)if(!match.racers.some(r=>r.id===id)){scene.remove(entry.root);sleds.delete(id)}
    if(match.phase==='blast'&&blastModels.length===0){
      for(const blast of match.blasts){
        const flare=mesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0xffa24d,transparent:true,depthWrite:false}),scene,blast.x,.37,blast.z);
        blastModels.push(flare);
      }
    }
    for(const model of blastModels){
      const fade=Math.min(1,Math.max(0,(serverNow-match.start)/sledBlast));
      model.scale.setScalar(.25+Math.min(1,fade*3)*sledRadius);
      model.material.opacity=.86*(1-fade);
      model.visible=match.phase==='blast';
    }
    renderer.render(scene,camera);
  }
  return {draw};
}
