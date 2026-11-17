import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const el=document.getElementById('stage'),scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);camera.position.set(0,0.45,innerWidth<650?14.5:11.8);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;el.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xded2ff,0x211029,2.2));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,7,6);scene.add(key);const rim=new THREE.PointLight(0xb347ff,65,14);rim.position.set(3,3,-2);scene.add(rim);
const mat=(color,metalness=.05,roughness=.3)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const skin=mat(0xd3c9e5,.25,.25),dark=mat(0x16101f,.5,.23),suit=mat(0x17121f,.28,.36),white=mat(0xf5efff,.05,.32),purple=mat(0x9c39e5,.15,.22),hairmat=mat(0x8730ce,.2,.24),hairLight=mat(0xc467f3,.18,.19),iris=mat(0x6b23bc,.05,.14),black=mat(0x10081d,.08,.15),gloss=mat(0xffffff,.05,.07);
const root=new THREE.Group();scene.add(root);root.position.y=-.35;
const mesh=(geo,m,parent,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);parent.add(o);return o};
const sph=(parent,m,x,y,z,a,b,c)=>{const o=mesh(new THREE.SphereGeometry(1,32,24),m,parent,x,y,z);o.scale.set(a,b,c);return o};
const cyl=(parent,m,x,y,z,top,bottom,h)=>mesh(new THREE.CylinderGeometry(top,bottom,h,20),m,parent,x,y,z);
// Suit, blouse, lapels, arms and boots form actual 3D geometry.
const torso=new THREE.Group();root.add(torso);torso.position.y=-.72;
sph(torso,suit,0,.1,0,.82,1.0,.48);sph(torso,white,0,.29,.425,.37,.73,.09);
for(const side of [-1,1]){const lap=mesh(new THREE.ConeGeometry(.28,.78,3),suit,torso,side*.34,.46,.49);lap.rotation.z=side*.22;lap.rotation.y=Math.PI/2;}
const arms=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.78,.52,0);torso.add(arm);sph(arm,suit,side*.13,-.38,0,.27,.56,.29);sph(arm,dark,side*.2,-.86,.08,.18,.2,.2);arms.push(arm);sph(torso,suit,side*.39,-1.08,0,.35,.65,.38);sph(torso,dark,side*.4,-1.7,.13,.38,.3,.55)}
// Head is independent and rotates in 3 axes.
const neck=cyl(root,dark,0,.23,0,.25,.24,.33);const head=new THREE.Group();head.position.y=1.35;root.add(head);
sph(head,skin,0,0,0,1.05,.95,.73);sph(head,skin,0,-.42,.25,.9,.58,.58);
// Oversized kawaii eyes: whites, dark pupils, violet irises, reflective highlights.
const eyes=[];for(const side of [-1,1]){const eye=new THREE.Group();eye.position.set(side*.44,.10,.665);head.add(eye);sph(eye,white,0,0,0,.32,.4,.13);sph(eye,iris,0,-.03,.12,.24,.31,.065);const pupil=sph(eye,black,0,-.035,.176,.135,.21,.035);sph(eye,gloss,-.085,.13,.2,.085,.1,.025);sph(eye,gloss,.10,-.12,.2,.035,.04,.014);eyes.push({eye,pupil})}
const mouth=sph(head,black,0,-.48,.735,.12,.055,.035);
// Soft smile highlights, no triangular black nose.
const smile=sph(head,mat(0x704577),0,-.47,.758,.19,.025,.016);
for(const side of [-1,1]){sph(head,mat(0xe987d9),side*.74,-.37,.52,.13,.08,.035);sph(head,dark,side*1.035,.12,0,.17,.48,.38);sph(head,purple,side*1.17,.12,.06,.07,.32,.3)}
const band=mesh(new THREE.TorusGeometry(1.05,.055,12,80,Math.PI),dark,head,0,.25,-.10);band.rotation.z=0;
// Separate glossy fringe and twin tails, with actual joint hierarchy.
const fringe=new THREE.Group();head.add(fringe);sph(fringe,hairmat,0,.76,-.12,1.04,.39,.74);
for(let i=0;i<9;i++){const strand=sph(fringe,i%4===0?hairLight:hairmat,-.83+i*.21,.62-(i*.014),.55,.155,.32,.15);strand.rotation.z=-.42+i*.08}
const tails=[];for(const side of [-1,1]){const pivot=new THREE.Group();pivot.position.set(side*.9,.78,-.17);head.add(pivot);
// Multi-section tapered ponytail with individual curved, glossy strands.
const sections=[{x:.16,y:-.24,r:.32,h:.47},{x:.28,y:-.69,r:.34,h:.55},{x:.40,y:-1.20,r:.29,h:.60},{x:.48,y:-1.70,r:.23,h:.49},{x:.43,y:-2.02,r:.15,h:.26}];
for(let j=0;j<sections.length;j++){const q=sections[j];const part=sph(pivot,j%3===0?hairLight:hairmat,side*q.x,q.y,.02,q.r,q.h,.29-j*.025);part.rotation.z=side*(.12+j*.09);}
for(let j=0;j<3;j++){const curve=sph(pivot,j===0?hairLight:hairmat,side*(.18+j*.09),-.57-j*.43,.27,.065,.34,.038);curve.rotation.z=side*.17;}
tails.push(pivot)}
let mode='idle',modeUntil=0,angle=0,targetAngle=0,lookX=0,lookY=0,blink=0,nextBlink=2,nextIdle=2,idlePose=0;
const setMode=(m)=>{mode=m;modeUntil=clock.getElapsedTime()+(m==='talk'?5:3);};document.querySelectorAll('button').forEach(b=>b.onclick=()=>setMode(b.dataset.emotion));
let drag=false,prevX=0,orbit=0;renderer.domElement.addEventListener('pointerdown',e=>{drag=true;prevX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(drag){orbit=Math.max(-.85,Math.min(.85,orbit+(e.clientX-prevX)*.006));prevX=e.clientX}});renderer.domElement.addEventListener('pointerup',()=>drag=false);
const clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime; // smooth damped pose changes
if(mode!=='idle'&&t>modeUntil)mode='idle';
if(t>nextIdle&&mode==='idle'){idlePose=Math.floor(Math.random()*5);nextIdle=t+2+Math.random()*4}
if(t>nextBlink){blink=1;nextBlink=t+1.8+Math.random()*4.5}blink=Math.max(0,blink-dt*8);
const shy=mode==='shy',curious=mode==='curious',happy=mode==='happy',talk=mode==='talk';
const damping=(speed)=>1-Math.exp(-dt*speed);
const tx=shy?-.16:curious?.17:mode==='idle'?[0,-.10,.11,.05,-.05][idlePose]:0;
const ty=shy?-.11:curious?.08:mode==='idle'?[0,.12,-.12,.06,-.08][idlePose]:0;
head.rotation.z+=(tx+Math.sin(t*.7)*.035-head.rotation.z)*damping(3);head.rotation.y+=(ty-head.rotation.y)*damping(3);head.rotation.x+=((shy?.15:curious?-.11:0)-head.rotation.x)*damping(3);
root.rotation.y+=(orbit-root.rotation.y)*damping(4);root.position.y=-.35+Math.sin(t*1.3)*.025;
for(const [i,o] of eyes.entries()){o.eye.scale.y+=(Math.max(.08,1-blink*.96)-o.eye.scale.y)*.45;o.pupil.position.x+=( (mode==='idle'?[0,-.045,.045,.02,-.02][idlePose]:curious?.04:shy?-.04:0)-o.pupil.position.x)*.09}
mouth.scale.y+=( (talk?.9+Math.abs(Math.sin(t*11))*.8:happy?1.6:shy?.6:1)-mouth.scale.y)*damping(9);smile.visible=!talk;
for(let i=0;i<tails.length;i++){const side=i===0?-1:1;tails[i].rotation.z+=(side*(.05+Math.sin(t*1.5+i*.7)*.07)-head.rotation.z*.35-tails[i].rotation.z)*.065;tails[i].rotation.x+=(Math.sin(t*1.2+i)*.06-tails[i].rotation.x)*.055}
for(let i=0;i<arms.length;i++){arms[i].rotation.z+=( (talk?Math.sin(t*5+i*2)*.24:happy?Math.sin(t*2+i)*.18:0)-arms[i].rotation.z)*.055}
renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.position.z=innerWidth<650?14.5:11.8;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
