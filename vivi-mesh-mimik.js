/* Vivi 3.9: deform the ORIGINAL illustration pixels. No replacement eyes, mouths or face overlays. */
(()=>{'use strict';
const start=()=>{
 const figure=document.getElementById('vincent'),img=document.getElementById('vivi-classic-art');
 if(!figure||!img||figure.dataset.viviMesh)return;
 figure.dataset.viviMesh='1';
 const canvas=document.createElement('canvas');canvas.id='vivi-classic-art';
 canvas.width=1199;canvas.height=1312;canvas.setAttribute('aria-label','Vivi');
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const source=new Image();source.decoding='async';source.src=img.currentSrc||img.src;
 source.onload=()=>{canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;img.replaceWith(canvas);run();};
 function run(){
 const W=canvas.width,H=canvas.height,sx=W/1199,sy=H/1312;
 const t0=performance.now();let last=0,blinkAt=t0+1700+Math.random()*3000,blinkStart=-1;
 // Actual spoken-word boundaries drive face and body. No random speaking gestures.
 let lastWord=0, mouthPulse=0, gesturePulse=0, headPulse=0, smilePulse=0;
 let speechHasBoundaries=false, speechStarted=0;
 window.addEventListener('vivi-speech-boundary',event=>{
   const word=String(event.detail?.text||'').toLocaleLowerCase('de-DE');
   lastWord=performance.now();speechHasBoundaries=true;
   mouthPulse=/[.!?]$/.test(word)?0.45:1;
   const emph=/(wirklich|super|toll|wichtig|genau|klar|ja|nein|wow|achtung|schön|freu|liebe|nicht|aber)/.test(word);
   gesturePulse=emph?1:0.38;
   headPulse=emph?1:0.24;
   smilePulse=/(freu|schön|toll|super|haha|witz|glück)/.test(word)?1:0;
 });
 window.addEventListener('vivi-speech-start',()=>{speechStarted=performance.now();speechHasBoundaries=false});
 window.addEventListener('vivi-speech-end',()=>{mouthPulse=0;gesturePulse=0;headPulse=0;smilePulse=0});
 const ease=(x)=>x*x*(3-2*x);
 const bell=(x,center,radius)=>{const u=Math.abs(x-center)/radius;return u>=1?0:Math.pow(1-ease(u),1.6)};
 function map(x,y,blink,mouth,smile){
  const a=bell(x,524,100)*bell(y,430,52);
  const b=bell(x,690,100)*bell(y,396,52);
  const eye=a+b;
  const eyeLine=(a*430+b*395)/(eye||1);
  // Compress original eyelid/iris pixels toward each eye's own center.
  const dyEye=eye*blink*(eyeLine-y)*.83;
  const mouthWeight=bell(x,632,88)*bell(y,535,53);
  const dyMouth=mouthWeight*(y-535)*(mouth*.34+smile*.12);
  const dxSmile=mouthWeight*smile*(x-632)*.085;
  return [x+dxSmile,y+dyEye+dyMouth];
 }
 function triangle(a,b,c,aa,bb,cc){
  const den=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);if(!den)return;
  const m0=(aa[0]*(b[1]-c[1])+bb[0]*(c[1]-a[1])+cc[0]*(a[1]-b[1]))/den;
  const m2=(aa[0]*(c[0]-b[0])+bb[0]*(a[0]-c[0])+cc[0]*(b[0]-a[0]))/den;
  const m4=(aa[0]*(b[0]*c[1]-c[0]*b[1])+bb[0]*(c[0]*a[1]-a[0]*c[1])+cc[0]*(a[0]*b[1]-b[0]*a[1]))/den;
  const m1=(aa[1]*(b[1]-c[1])+bb[1]*(c[1]-a[1])+cc[1]*(a[1]-b[1]))/den;
  const m3=(aa[1]*(c[0]-b[0])+bb[1]*(a[0]-c[0])+cc[1]*(b[0]-a[0]))/den;
  const m5=(aa[1]*(b[0]*c[1]-c[0]*b[1])+bb[1]*(c[0]*a[1]-a[0]*c[1])+cc[1]*(a[0]*b[1]-b[0]*a[1]))/den;
  ctx.save();ctx.beginPath();ctx.moveTo(aa[0]*sx,aa[1]*sy);ctx.lineTo(bb[0]*sx,bb[1]*sy);ctx.lineTo(cc[0]*sx,cc[1]*sy);ctx.closePath();ctx.clip();
  ctx.setTransform(m0,m1*sy/sx,m2*sx/sy,m3,m4*sx,m5*sy);
  ctx.drawImage(source,0,0,1199,1312);ctx.restore();
 }
 function frame(now){
  requestAnimationFrame(frame);if(document.hidden||now-last<45)return;last=now;
  if(now>blinkAt&&blinkStart<0)blinkStart=now;
  let blink=0;if(blinkStart>=0){const dt=now-blinkStart;blink=dt<105?ease(dt/105):dt<190?1-ease((dt-105)/85):0;if(dt>=190){blinkStart=-1;blinkAt=now+2200+Math.random()*4200;}}
  const talking=figure.classList.contains('talking')||figure.classList.contains('audio-speaking');
  if(talking&&!speechStarted){speechStarted=now;speechHasBoundaries=false;}
  if(!talking){speechStarted=0;speechHasBoundaries=false;}
  const elapsed=Math.max(0,now-lastWord);
  const wordEnvelope=Math.max(0,1-elapsed/420);
  // Only word events move the mouth. If Android omits boundary events, no fake lip sync.
  const speechMouth=talking&&speechHasBoundaries?mouthPulse*wordEnvelope:0;
  const speechGesture=talking&&speechHasBoundaries?gesturePulse*Math.max(0,1-elapsed/850):0;
  const speechHead=talking&&speechHasBoundaries?headPulse*Math.max(0,1-elapsed/700):0;
  const thinking=figure.classList.contains('thinking');
  const mouth=speechMouth;
  const smile=talking?smilePulse*wordEnvelope*.32:(thinking?.08:.07);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.drawImage(source,0,0,W,H);
  // Warp original pixels of neck, torso and arms in response to spoken words.
  // Region weights keep the background/hair edges anchored to the original image.
  if(speechGesture>.005||speechHead>.005){
   function bodyMap(x,y){
    const neck=bell(x,600,165)*bell(y,660,195);
    const left=bell(x,355,220)*bell(y,920,300);
    const right=bell(x,865,220)*bell(y,920,300);
    const chest=bell(x,605,370)*bell(y,950,340);
    const head=bell(x,602,275)*bell(y,460,320);
    const shift=speechHead*head*3.3;
    const shoulder=(left-right)*speechGesture*4.5;
    const lift=(left+right)*speechGesture*3.2;
    const breathe=chest*(talking?0:Math.sin(now/1500)*1.1);
    return [x+shift+shoulder+neck*speechHead*1.4,y-lift+breathe];
   }
   const stepBody=42;
   for(let y=140;y<1290;y+=stepBody)for(let x=130;x<1080;x+=stepBody){
    const x2=Math.min(x+stepBody,1080),y2=Math.min(y+stepBody,1290);
    const a=[x,y],b=[x2,y],c=[x,y2],d=[x2,y2];
    const aa=bodyMap(x,y),bb=bodyMap(x2,y),cc=bodyMap(x,y2),dd=bodyMap(x2,y2);
    triangle(a,b,c,aa,bb,cc);triangle(b,d,c,bb,dd,cc);
   }
  }
  if(blink<.005&&mouth<.05&&smile<.05)return;
  // Re-render only the existing face pixels inside a local mesh.
  const step=25,x0=400,x1=785,y0=315,y1=600;
  for(let y=y0;y<y1;y+=step)for(let x=x0;x<x1;x+=step){
   const x2=Math.min(x+step,x1),y2=Math.min(y+step,y1);
   const a=[x,y],b=[x2,y],c=[x,y2],d=[x2,y2];
   const aa=map(x,y,blink,mouth,smile),bb=map(x2,y,blink,mouth,smile),cc=map(x,y2,blink,mouth,smile),dd=map(x2,y2,blink,mouth,smile);
   triangle(a,b,c,aa,bb,cc);triangle(b,d,c,bb,dd,cc);
  }
 }
 requestAnimationFrame(frame);
 }
};
let n=0;const wait=()=>{start();if(!document.querySelector('#vincent canvas#vivi-classic-art')&&n++<100)setTimeout(wait,150)};wait();
})();
