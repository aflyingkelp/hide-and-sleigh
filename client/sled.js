import * as T from './three.module.js';
import {sledOuter,sledInner,sledRadius,sledBlast,driveLap,driveSled} from './sled-rules.js?v=15';

export function makeSledArena(makeAvatar){
  const scene=new T.Scene();
  scene.background=new T.Color('#30485e');
  scene.fog=new T.FogExp2('#30485e',.012);
  scene.add(new T.HemisphereLight(0xd4f4ff,0x577399,1.65));
  const sky=new T.DirectionalLight(0xd1eaff,1.8);
  sky.position.set(-18,24,16);scene.add(sky);
  const camera=new T.PerspectiveCamera(74,innerWidth/innerHeight,.055,190);
  camera.rotation.order='YXZ';
  scene.add(camera);
  const materials=new Map();
  const solid=color=>{
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.82}));
    return materials.get(color);
  };
  const unitBox=new T.BoxGeometry(1,1,1);
  function mesh(geometry,material,parent,x=0,y=0,z=0){
    const item=new T.Mesh(geometry,material);
    item.position.set(x,y,z);parent.add(item);return item;
  }
  function box(w,h,d,color,parent,x=0,y=0,z=0){
    const item=mesh(unitBox,solid(color),parent,x,y,z);
    item.scale.set(w,h,d);
    return item;
  }
  function disc(geometry,material,parent,y){
    const item=mesh(geometry,material,parent,0,y,0);
    item.rotation.x=-Math.PI/2;return item;
  }
  function iceTexture(){
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=512;
    const ctx=canvas.getContext('2d');
    let seed=7851;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
    const image=ctx.createImageData(512,512);
    for(let i=0;i<image.data.length;i+=4){
      const grain=222+Math.floor(random()*32);
      image.data[i]=grain-15;image.data[i+1]=grain-5;image.data[i+2]=grain;image.data[i+3]=255;
    }
    ctx.putImageData(image,0,0);
    for(let i=0;i<410;i++){
      const x=random()*512,y=random()*512;
      ctx.strokeStyle=i%3?'rgba(253,255,255,.20)':'rgba(94,153,180,.22)';
      ctx.lineWidth=.4+random()*1.15;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7+random()*25,y-3+random()*6);ctx.stroke();
    }
    const texture=new T.CanvasTexture(canvas);
    texture.colorSpace=T.SRGBColorSpace;
    texture.wrapS=texture.wrapT=T.RepeatWrapping;
    texture.anisotropy=4;
    return texture;
  }
  const iceMap=iceTexture();
  function iceDisc(geometry,color){
    const vertices=geometry.attributes.position, uv=geometry.attributes.uv;
    for(let i=0;i<vertices.count;i++)uv.setXY(i,vertices.getX(i)/7,vertices.getY(i)/7);
    return disc(geometry,new T.MeshStandardMaterial({color,map:iceMap,roughness:.76}),scene,0);
  }
  disc(new T.CircleGeometry(155,64),solid('#98b1c6'),scene,-1.05);
  disc(new T.CircleGeometry(sledOuter+2,80),solid('#173247'),scene,-.88);
  iceDisc(new T.RingGeometry(sledInner,sledOuter,80),'#75a6ba');
  const center=iceDisc(new T.CircleGeometry(sledInner+.02,80),'#668fa6');
  const freezeLines=new T.Group();scene.add(freezeLines);
  for(let i=0;i<15;i++){
    const a=i*2.399, r=2+(i%5)*1.49;
    const scratch=box(1.5+i%4,.014,.045,'#82b9c8',freezeLines,Math.cos(a)*r,.019,Math.sin(a)*r);
    scratch.rotation.y=a*.61;
  }
  disc(new T.RingGeometry(sledInner-.02,sledInner+.13,80),solid('#c6e6fb'),scene,.023);
  disc(new T.RingGeometry(18.45,18.55,80),solid('#a4d1e4'),scene,.017);
  const boxRows=new Map();
  function sceneryBox(color,x,y,z,w,h,d,yaw=0){
    if(!boxRows.has(color))boxRows.set(color,[]);
    boxRows.get(color).push({x,y,z,w,h,d,yaw});
  }
  const blocks=68;
  for(let i=0;i<blocks;i++){
    const a=i*Math.PI*2/blocks;
    const x=Math.sin(a)*sledOuter,z=Math.cos(a)*sledOuter;
    sceneryBox(i%2?'#294d69':'#416883',x,.72,z,2.25,1.48,.62,a);
    sceneryBox('#d0e7ef',x,1.52,z,2.25,.16,.7,a);
    if(i%5===0){
      sceneryBox('#f86c72',x,1.69,z,.38,.29,.35,a);
      sceneryBox('#d0eef5',x*.974,.84,z*.974,.27,.82,.08,a);
    }
  }
  for(let sector=0;sector<4;sector++){
    const axis=sector*Math.PI/2;
    for(let j=0;j<8;j++){
      const radius=17.65+j*.23;
      sceneryBox(j%2?'#e2f2f4':'#afc6d2',Math.sin(axis)*radius,.018,Math.cos(axis)*radius,.54,.02,.23,axis);
    }
  }
  for(let i=0;i<18;i++){
    const a=i*2.399,r=36+(i%5)*5.8;
    sceneryBox(i%2?'#7395a9':'#657f97',Math.cos(a)*r,1.1+(i%4)*.37,Math.sin(a)*r,5+i%3,3+i%4,3.8,a);
  }
  const matrix=new T.Matrix4(),quaternion=new T.Quaternion(),euler=new T.Euler();
  const translation=new T.Vector3(),scale=new T.Vector3();
  for(const [color,rows] of boxRows){
    const batch=new T.InstancedMesh(unitBox,solid(color),rows.length);
    rows.forEach((row,i)=>{
      quaternion.setFromEuler(euler.set(0,row.yaw,0));
      matrix.compose(translation.set(row.x,row.y,row.z),quaternion,scale.set(row.w,row.h,row.d));
      batch.setMatrixAt(i,matrix);
    });
    scene.add(batch);
  }
  const pineShape=new T.ConeGeometry(1,1,5);
  const trees=new T.InstancedMesh(pineShape,solid('#294f56'),220);
  const snowcaps=new T.InstancedMesh(pineShape,solid('#9dbacb'),220);
  for(let i=0;i<110;i++){
    const angle=i*2.399, radius=32+(i%11)*4.7;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    const size=3.3+(i%7)*.57;
    quaternion.setFromEuler(euler.set(0,angle,0));
    for(let tier=0;tier<2;tier++){
      const width=size*(tier?.27:.42),y=size*(tier?.78:.46);
      matrix.compose(translation.set(x,y,z),quaternion,scale.set(width,size*.75,width));
      trees.setMatrixAt(i*2+tier,matrix);
      matrix.compose(translation.set(x,y+size*.16,z),quaternion,scale.set(width*.56,size*.45,width*.56));
      snowcaps.setMatrixAt(i*2+tier,matrix);
    }
  }
  scene.add(trees,snowcaps);
  const landscape=new T.InstancedMesh(new T.ConeGeometry(1,1,5),solid('#54738d'),15);
  for(let i=0;i<15;i++){
    const a=i*2*Math.PI/15,r=84+(i%3)*13,h=17+(i%4)*5;
    quaternion.setFromEuler(euler.set(0,a,0));
    matrix.compose(translation.set(Math.sin(a)*r,h*.47,Math.cos(a)*r),quaternion,scale.set(22,h,20));
    landscape.setMatrixAt(i,matrix);
  }
  scene.add(landscape);
  const sleds=new Map();
  // Each horizontal strip of the existing PNG is mapped onto a seated silhouette.
  const seatedPortrait=new T.PlaneGeometry(1.46,2.02,1,20);
  const points=seatedPortrait.attributes.position;
  for(let i=0;i<points.count;i++){
    const t=(points.getY(i)+1.01)/2.02;
    const y=t<.22?.05+t*1.75:t<.49?.435+(t-.22)*.32:.521+(t-.49)*1.84;
    const z=t<.22?.86+t*.55:t<.49?.981-(t-.22)*3.26:.1;
    points.setY(i,y);
    points.setZ(i,z);
  }
  seatedPortrait.computeVertexNormals();
  seatedPortrait.computeBoundingSphere();
  function gift(parent,x,y,z){
    const present=new T.Group();
    present.position.set(x,y,z);parent.add(present);
    box(.62,.5,.57,'#b52c53',present,0,.25);
    box(.13,.51,.58,'#ffcf6e',present,0,.25);
    box(.63,.06,.14,'#ffcf6e',present,0,.51);
    return present;
  }
  // The visible nose is attached to the camera so it cannot swing during reconciliation.
  const cockpit=new T.Group();camera.add(cockpit);
  box(1.05,.19,.98,'#a14251',cockpit,0,-1.04,-1.02);
  for(const x of [-.48,.48])box(.1,.15,.9,'#b7d2e0',cockpit,x,-.91,-.99);
  const cabinGift=gift(cockpit,0,-.93,-1.34);
  function rider(id,local){
    const root=new T.Group();scene.add(root);
    box(1.16,.21,2.48,local?'#b44c58':'#294c65',root,0,.26,-.16);
    box(.8,.19,.53,'#22384a',root,0,.44,.29);
    box(.8,.47,.13,'#22384a',root,0,.65,.53);
    for(const x of [-.51,.51])box(.09,.18,1.49,'#698fa6',root,x,.43,-.25);
    for(const x of [-.43,.43]){
      box(.13,.12,2.58,'#d1eaf7',root,x,.06,-.16);
      box(.15,.27,.13,'#84b0c6',root,x,.17,-.65);
      box(.15,.27,.13,'#84b0c6',root,x,.17,.65);
    }
    const avatar=makeAvatar(id);
    avatar.children[0].geometry=seatedPortrait;
    avatar.children[0].position.y=0;
    avatar.position.set(0,.29,.25);
    root.add(avatar);
    const parcel=gift(root,0,.37,-.99);
    const entry={root,parcel,avatar};
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
  let predicted=null,receivedTick=-1,driveKey='',lastCameraId='';
  const correction={x:0,z:0,yaw:0,vx:0,vz:0};
  const inputHistory=[];
  function resetCorrection(){
    correction.x=correction.z=correction.yaw=correction.vx=correction.vz=0;
    inputHistory.length=0;
  }
  function reconcile(match,racer,input,serverNow,dt){
    const key=match.heat+':'+match.phase+':'+racer.id;
    if(key!==driveKey){
      driveKey=key;predicted={...racer};receivedTick=-1;resetCorrection();
    }
    if(match.phase==='lap'){
      driveLap(predicted,Math.min(match.deadline,serverNow)-match.start);
      return predicted;
    }
    if(match.phase!=='rush')return predicted;
    const lastInput=inputHistory.at(-1);
    if(!lastInput||lastInput.ax!==input.ax||lastInput.az!==input.az)inputHistory.push({...input,time:serverNow});
    while(inputHistory.length>1&&inputHistory[1].time<serverNow-850)inputHistory.shift();
    driveSled(predicted,input.ax,-input.az,dt);
    if(receivedTick!==match.tick){
      receivedTick=match.tick;
      const replay={...racer};
      const begin=Math.max(match.tick,serverNow-400);
      let cursor=begin;
      let applied={ax:racer.ax,az:racer.az};
      for(const sample of inputHistory){
        if(sample.time<=begin){applied=sample;continue}
        if(sample.time>serverNow)break;
        driveSled(replay,applied.ax,-applied.az,(sample.time-cursor)/1000);
        cursor=sample.time;
        applied=sample;
      }
      driveSled(replay,applied.ax,-applied.az,Math.max(0,(serverNow-cursor)/1000));
      const yawError=replay.yaw-predicted.yaw;
      correction.yaw=Math.atan2(Math.sin(yawError),Math.cos(yawError));
      for(const axis of ['x','z','vx','vz'])correction[axis]=replay[axis]-predicted[axis];
    }
    const blend=1-Math.exp(-dt*7);
    for(const axis of ['x','z','yaw','vx','vz']){
      const move=correction[axis]*blend;
      predicted[axis]+=move;
      correction[axis]-=move;
    }
    return predicted;
  }
  function draw(renderer,match,self,serverNow,dt,input){
    const aspect=innerWidth/innerHeight;
    if(camera.aspect!==aspect){camera.aspect=aspect;camera.updateProjectionMatrix()}
    const local=match.racers.find(r=>r.id===self);
    const observer=local?.alive?local:match.racers.find(r=>r.alive);
    const pose=observer?.id===self?reconcile(match,observer,input,serverNow,dt):observer;
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
      const alpha=1-Math.exp(-dt*13);
      if(!entry.heat||entry.heat!==match.heat){entry.root.position.set(r.x,0,r.z);entry.root.rotation.y=r.yaw;entry.heat=match.heat}
      const drift=match.phase==='lap'||match.phase==='rush'?Math.min(.12,Math.max(0,(serverNow-match.tick)/1000)):0;
      entry.root.position.x+=(r.x+r.vx*drift-entry.root.position.x)*alpha;
      entry.root.position.z+=(r.z+r.vz*drift-entry.root.position.z)*alpha;
      const turn=r.yaw-entry.root.rotation.y;
      entry.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*alpha;
      entry.root.visible=r.alive&&r.id!==observer?.id;
      entry.parcel.visible=r.gift&&!inBlast;
      entry.avatar.visible=r.id!==observer?.id;
      if(pose&&r.id===observer.id){
        entry.root.position.set(pose.x,0,pose.z);
        entry.root.rotation.y=pose.yaw;
      }
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
    if(pose){
      const driverChanged=lastCameraId!==observer.id;
      const blend=driverChanged?1:1-Math.exp(-dt*24);
      const forwardX=-Math.sin(pose.yaw),forwardZ=-Math.cos(pose.yaw);
      camera.position.lerp(translation.set(pose.x+forwardX*.17,1.55,pose.z+forwardZ*.17),blend);
      const turn=pose.yaw-camera.rotation.y;
      camera.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*blend;
      camera.rotation.x=-.1;
      lastCameraId=observer.id;
    }
    cockpit.visible=!!observer&&!inBlast;
    cabinGift.visible=!!observer?.gift;
    renderer.render(scene,camera);
    if(!pose)return null;
    const target=match.phase==='rush'&&observer.gift&&match.receivers
      .filter(receiver=>!receiver.claim)
      .sort((a,b)=>Math.hypot(pose.x-a.x,pose.z-a.z)-Math.hypot(pose.x-b.x,pose.z-b.z))[0];
    const angle=target?Math.atan2(target.x-pose.x,-(target.z-pose.z))+pose.yaw:0;
    const bearing=Math.atan2(Math.sin(angle),Math.cos(angle));
    return {speed:Math.hypot(pose.vx,pose.vz),bearing,target};
  }
  return {draw};
}
