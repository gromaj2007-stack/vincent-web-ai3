/* Vivi 2.1.1 — independent smooth head gestures; no figure translation. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg');if(!svg)return;
const NS='http://www.w3.org/2000/svg',shell=document.createElementNS(NS,'g');
shell.id='vivi-articulated-head';
const kids=[...svg.children],start=kids.findIndex(n=>n.tagName.toLowerCase()==='rect'&&n.getAttribute('x')==='252'&&n.getAttribute('y')==='449');
if(start>=0){svg.append(shell);for(const n of kids.slice(start)){if(n!==shell)shell.append(n)}}
let angle=0,lift=0,hairL=0,hairR=0,last=performance.now(),gesture='happy',gestureUntil=0,wakeUntil=0;
window.viviMotionGesture=(name,duration=1600)=>{gesture=name;gestureUntil=performance.now()+duration};
const prev=window.vincentWake;window.vincentWake=()=>{prev?.();wakeUntil=performance.now()+1800};
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.max(0,Math.min(.06,(now-last)/1000));last=now;if(document.hidden)return;
 const chat=document.querySelector('main')?.classList.contains('chat-open');
 const phase=document.querySelector('main')?.dataset.viviStage||'center';
 const speaking=host.classList.contains('talking')||host.classList.contains('audio-speaking');
 const listening=host.classList.contains('listening'),thinking=host.classList.contains('thinking');
 let a=0,y=0;
 if(now<wakeUntil){const t=1-(wakeUntil-now)/1800;a=11*Math.sin(t*Math.PI*2);y=-12*Math.sin(t*Math.PI)}
 else if(chat){a=phase==='peek-left'?12:phase==='peek-right'?-12:phase==='duck'||phase==='shy-low'?-8:4*Math.sin(now/1100);y=phase==='duck'?10:-3+3*Math.sin(now/900)}
 else if(speaking){a=8*Math.sin(now/380)+2*Math.sin(now/890);y=-3+5*Math.sin(now/290)}
 else if(listening){a=-9;y=-6}
 else if(thinking){a=8;y=4}
 else if(now<gestureUntil){a=gesture==='shy'?-10:gesture==='curious'?12:gesture==='playful'?-8:5;y=-7}
 else{
  const idle=window.viviIdlePose||'rest';
  a=idle==='look-left'?-9:idle==='look-right'?9:idle==='tilt-left'?-13:idle==='tilt-right'?13:idle==='curious'?7:idle==='shy'?-7:2.2*Math.sin(now/1750);
  y=idle==='curious'?-7:idle==='shy'?5:2.5*Math.sin(now/1500);
}
 const k=1-Math.exp(-dt*5.2);angle+=(a-angle)*k;lift+=(y-lift)*k;
 shell.setAttribute('transform',`translate(0 ${lift.toFixed(2)}) rotate(${angle.toFixed(2)} 320 465)`);
 const l=svg.querySelector('#vivi-hair-left'),r=svg.querySelector('#vivi-hair-right');
 hairL+=(Math.max(-9,Math.min(9,-angle*.4+2*Math.sin(now/850)))-hairL)*(1-Math.exp(-dt*2.3));
 hairR+=(Math.max(-9,Math.min(9,-angle*.4-2*Math.sin(now/930)))-hairR)*(1-Math.exp(-dt*2.1));
 if(l)l.setAttribute('transform',`rotate(${hairL.toFixed(2)} 178 164)`);
 if(r)r.setAttribute('transform',`rotate(${hairR.toFixed(2)} 462 164)`);
}requestAnimationFrame(frame);
})();
