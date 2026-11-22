export const LIMIT=101,boxes=[],props=[],buildings=[],trees=[],lamps=[];
export const TYPES={gift:{label:'Wrapped present',h:.8,r:.4},crate:{label:'Wooden crate',h:1.1,r:.52},barrel:{label:'Barrel',h:1.15,r:.48},chair:{label:'Chair',h:1.25,r:.42},snowman:{label:'Snowman',h:1.8,r:.52},pine:{label:'Potted fir',h:1.9,r:.48},lantern:{label:'Lantern',h:.65,r:.25},sack:{label:'Toy sack',h:.95,r:.45},soldier:{label:'Toy soldier',h:1.6,r:.3},stool:{label:'Stool',h:.65,r:.35},books:{label:'Stack of books',h:.45,r:.36},wreath:{label:'Wreath',h:.8,r:.38},rocking:{label:'Rocking horse',h:1.1,r:.55},floorlamp:{label:'Floor lamp',h:1.8,r:.3},suitcase:{label:'Suitcase',h:.7,r:.42},globe:{label:'Globe',h:1.4,r:.3},clock:{label:'Grandfather clock',h:2.4,r:.38},teddy:{label:'Teddy bear',h:.8,r:.36},candelabra:{label:'Candelabra',h:1.2,r:.25},harp:{label:'Toy harp',h:1.4,r:.42},trunk:{label:'Travel trunk',h:.9,r:.48},nutcracker:{label:'Nutcracker',h:1.5,r:.3},ornament:{label:'Giant ornament',h:1.05,r:.4},birdcage:{label:'Birdcage',h:1.25,r:.34},telescope:{label:'Telescope',h:1.4,r:.3}};
let seed=237;export function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function box(x,y,z,w,h,d,c,solid=true,rot=0){boxes.push({x,y,z,w,h,d,c,solid,rot});}
function prop(type,x,z,color='#a23b46',yaw=0){const p={id:props.length,type,x,z,color,yaw,...TYPES[type]};props.push(p);return p}
const names=['Northstar Lodge','Gingerbread Bakery','Old Toy Factory','Winter Clinic','Ranger Outpost','The Post Office','Glasshouse Nursery','Hearthside Inn','Carpenters Hall','St Nicholas Chapel','Parcel Warehouse','Clockmakers Shop','Frozen Market','The Schoolhouse','Tinsel Theatre','Fire Station','Candle Workshop','Grandmas Cottage','Christmas Archive','The Old Stables','Cocoa Cafe','Snowfall Station','Music Hall','Reindeer Supplies'];
const themes=['home','bakery','factory','clinic','ranger','post','greenhouse','inn','woodshop','chapel','warehouse','clock','market','school','theatre','fire','candles','home','library','stable','cafe','station','music','warehouse'];
for(let row=0,n=0;row<5;row++)for(let col=0;col<5;col++){if(row===2&&col===2)continue;const x=(col-2)*37,z=(row-2)*37,w=[24,26,22,25][n%4],d=[23,25,22][n%3],theme=themes[n],c=['#375d53','#68483d','#47586b','#674650'][n%4];buildings.push({id:n,name:names[n],theme,x,z,w,d});
 box(x,-.02,z,w,.2,d,'#634d3d',false);const H=10.8;
 // Four real entrances and interior cross-connections create multiple chase routes.
 for(const side of [-1,1]){box(x-w/4-.8,1.8,z+side*d/2,w/2-1.6,3.6,.35,c);box(x+w/4+.8,1.8,z+side*d/2,w/2-1.6,3.6,.35,c);box(x,3.3,z+side*d/2,3.2,.6,.45,'#c2ab83',false);box(x+side*w/2,1.8,z-d/4-.8,.35,3.6,d/2-1.6,c);box(x+side*w/2,1.8,z+d/4+.8,.35,3.6,d/2-1.6,c);box(x+side*w/2,3.3,z,.45,.6,3.2,'#c2ab83',false);
 for(let f=0;f<3;f++){const fy=f*3.6;box(x,fy+1.8,z+side*(d/4),.22,3.6,d/2-3,'#647569');box(x+side*w/4,fy+1.8,z,w/2-3,3.6,.22,'#647569');box(x+side*w/4,fy+3.7,z,w/2+1,.22,d+1.6,'#8498a4',false,side*.12);}
 for(let f=0;f<3;f++){const fy=f*3.6+2;box(x+side*w*.28,fy,z+d/2+.2,2.3,1.2,.1,'window',false);box(x+side*w*.28,fy,z-d/2-.2,2.3,1.2,.1,'window',false);box(x+side*w/2+side*.2,fy,z-d*.27,.1,1.2,2.3,'window',false)}
 
 
 }
 for(let f=0;f<3;f++){for(let i=0;i<9;i++){const ax=(i%3)-1,az=Math.floor(i/3)-1,rx=x+ax*w*.27,rz=z+az*d*.27,fy=f*3.6;const type=['wreath','rocking','floorlamp','suitcase','globe','clock','teddy','candelabra','harp','trunk','nutcracker','ornament','birdcage','telescope','gift','books','chair','barrel','pine','snowman','lantern','crate','soldier','sack'][(n*7+f*9+i)%24];prop(type,rx,rz,['#a7434b','#44776b','#b89655','#765442'][(n+f+i)%4]);}box(x-w*.28, f*3.6+1,z,4,1.8,2,'#765c47',false);box(x+w*.28, f*3.6+1,z,4,1.8,2,'#52645b',false);box(x,f*3.6+3.3,z,1.8,.18,1.8,'#d1b981',false);for(let step=0;step<12;step++)box(x-w*.34+step*.32,f*3.6+step*.28+.14,z,1.4,.28,2.1,step%2?'#9b7957':'#795b43',false);}box(x+w*.33,10.5,z-d*.3,1.3,2,1.3,'#715446',false);box(x,10.9,z+d/2+1.4,5,.2,2.8,n%2?'#9b3944':'#3f7568',false);for(const side of [-1,1])box(x+side*2.3,10.2,z+d/2+2.4,.15,2.8,.15,'#c6b28a');
 for(const ax of [-1,1])for(const az of [-1,1]){const rx=x+ax*w*.28,rz=z+az*d*.28;
 // Each quarter gets a distinct furnishing arrangement, with clear aisles.
 const k=(n+(ax===1?1:0)+(az===1?2:0))%4;
 if(['warehouse','factory','post','stable'].includes(theme)){for(let i=0;i<2;i++){box(rx+ax*(i*.9),.8,rz,1.8,1.6,2,'#74563d');prop(i?'sack':'crate',rx-ax*2,rz+az*2,'#8e6c47');}prop('soldier',rx-ax*2.2,rz-az*1.8,'#b63d48');}
 else if(theme==='chapel'||theme==='school'||theme==='theatre'){box(rx,.5,rz,3,1,1,'#78583c');box(rx,.9,rz-az*.45,3,.8,.15,'#896345');prop('chair',rx-ax*2,rz+az*2,'#855c3c');prop('books',rx+ax*2,rz+az*2,'#356d6b');}
 else if(k===0){box(rx,.75,rz,2.4,1.5,1.4,'#69513a');box(rx,1.55,rz,2.6,.1,1.6,'#d2c3a5');prop('chair',rx-ax*2,rz,'#966b4b');prop('lantern',rx+ax*2,rz+az*2,'#c49446');}
 else if(k===1){box(rx,.5,rz,3.6,1,1.3,'#8a4650');box(rx,1.05,rz-az*.55,3.6,.9,.2,'#8a4650');prop('stool',rx-ax*2.1,rz+az*2,'#72523c');prop('gift',rx+ax*1.5,rz+az*2,'#a63d46');}
 else if(k===2){box(rx,.35,rz,2.2,.6,3.4,'#745744');box(rx,.8,rz,2,.3,3,'#acbdb2');prop('sack',rx+ax*2,rz+az*2,'#aa8654');prop('books',rx-ax*1.8,rz-az*1.6,'#91424e');}
 else {box(rx,1.4,rz,2.7,2.8,.8,'#795b3e');for(let i=0;i<3;i++)box(rx,.5+i*.8,rz+az*.45,2.7,.1,.12,'#b79a71',false);prop('barrel',rx+ax*2,rz+az*2,'#81643e');prop('pine',rx-ax*2,rz+az*1.7,'#2f6b54');}
 if(theme==='greenhouse')prop('pine',rx,rz+az*2,'#366e54');if(theme==='bakery'||theme==='cafe')prop('stool',rx+ax,rz+az*2,'#92704d');
 }
 prop('gift',x+w/2+2.5,z+3,'#3e7a6e');prop('barrel',x-w/2-2.5,z-3,'#785a3b');prop('snowman',x+4,z+d/2+4,'#d7e8e7');lamps.push([x-4,z+d/2+3]);n++;
}
// Central plaza, hedge maze, covered market stalls, forest and connected streets.
for(let i=0;i<5;i++){const q=(i-2)*37+18.5;box(q,-.13,0,6,.04,204,'#526572',false);box(0,-.12,q,204,.04,6,'#526572',false)}
box(0,-.08,0,26,.07,26,'#778b91',false);for(let i=0;i<12;i++){const a=i*Math.PI/6;prop(i%3?'gift':'pine',Math.cos(a)*6,Math.sin(a)*6,i%2?'#aa3e4b':'#377c69')}
trees.push([0,0,2.2]);for(let i=0;i<92;i++){const a=i*Math.PI*2/92;trees.push([Math.cos(a)*99,Math.sin(a)*99,1+random()*.7])}
for(let i=0;i<20;i++){const x=-15+(i%5)*7.5,z=i<10?-96:96;box(x,.8,z,3,1.6,1,'#315647');prop('crate',x,z+(z>0?-2:2),'#826540')}
// Small spatial buckets are shared by movement and server-side tag validation.
const buckets=new Map();for(const b of boxes){if(!b.solid)continue;for(let x=Math.floor((b.x-b.w/2)/5);x<=Math.floor((b.x+b.w/2)/5);x++)for(let z=Math.floor((b.z-b.d/2)/5);z<=Math.floor((b.z+b.d/2)/5);z++){const k=x+','+z;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(b)}}
export function blocked(x,z,r=.32){if(Math.abs(x)>LIMIT-r||Math.abs(z)>LIMIT-r)return true;const found=new Set();for(let gx=Math.floor((x-r)/5);gx<=Math.floor((x+r)/5);gx++)for(let gz=Math.floor((z-r)/5);gz<=Math.floor((z+r)/5);gz++)for(const b of buckets.get(gx+','+gz)||[])found.add(b);for(const b of found)if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return true;return false}
export function clearLine(a,b){const d=Math.hypot(a.x-b.x,a.z-b.z),steps=Math.ceil(d*4);for(let i=1;i<steps;i++)if(blocked(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,.02))return false;return true}
export function spawn(i,seeker=false){return seeker?{x:0,z:12}:{x:-9+(i%6)*3.6,z:12+Math.floor(i/6)*3};}

// Game coordinates for the launcher. The first surface or player stops the shot.
export const rocketCooldown=2400;
export const rocketRadius=3.6;
export const tauntNames=['He He He Ha','Death Bong','Metal Pipe','WYSI','Scream','Get Back Here','Weird Route','Dance Moves'];
export const trapBeats=[1400,2480,3360,4620];
export const trapWindow=230;
export const trapDuration=5250;
export function rocketPath(x,z,yaw,pitch,players=[]){
  const start={x,y:1.82,z};
  const direction={x:-Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(yaw)*Math.cos(pitch)};
  const range=23;
  const end={x:x+direction.x*range,z:z+direction.z*range};
  const obstacles=boxes.filter(b=>b.h>.12&&b.y+b.h/2>.1
    &&b.x+b.w/2>=Math.min(x,end.x)&&b.x-b.w/2<=Math.max(x,end.x)
    &&b.z+b.d/2>=Math.min(z,end.z)&&b.z-b.d/2<=Math.max(z,end.z));
  for(let distance=.24;distance<=range;distance+=.16){
    const point={x:x+direction.x*distance,y:start.y+direction.y*distance,z:z+direction.z*distance};
    if(point.y<.1||Math.abs(point.x)>LIMIT||Math.abs(point.z)>LIMIT
      ||obstacles.some(b=>Math.abs(point.x-b.x)<b.w/2&&Math.abs(point.y-b.y)<b.h/2&&Math.abs(point.z-b.z)<b.d/2)
      ||players.some(p=>Math.hypot(point.x-p.x,point.z-p.z)<(props[p.prop]?.r||.37)
        &&point.y<.1+(props[p.prop]?.h||1.9))){
      return {start,impact:{x:point.x-direction.x*.17,y:point.y-direction.y*.17,z:point.z-direction.z*.17}};
    }
  }
  return {start,impact:{...end,y:start.y+direction.y*range}};
}

