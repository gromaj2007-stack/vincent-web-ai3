/* Vivi 2.0.9 – independent head motion director, smooth exponential damping. */
(()=>{'use strict';const host=document.getElementById('vincent'),svg=host?.querySelector('svg');if(!svg)return;
const NS='http://www.w3.org/2000/svg';const shell=document.createElementNS(NS,'g');shell.id='vivi-articulated-head';
const children=[...svg.children],start=children.findIndex(n=>n.tagName.toLowerCase()==='rect'&&n.getAttribute('x')==='252'&&n.getAttribute('y')==='449');
if(start>=0){svg.append(shell);for(const n of children.slice(start)){if(n!==shell)shell.append(n)}}
let tilt=0,lift=0,last=performance.now(),wake=0;
const previous=window.vincentWake;window.vincentWake=()=>{previous?.();wake=performance.now()+1800};
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;
const chat=document.querySelector('main')?.classList.contains('chat-open'),stage=document.querySelector('main')?.dataset.viviStage;
const talking=host.classList.contains('talking')||host.classList.contains('audio-speaking'),listen=host.classList.contains('listening'),think=host.classList.contains('thinking');
let a=0,y=0;if(now<wake){const p=1-(wake-now)/1800;a=9*Math.sin(p*Math.PI*2);y=-12*Math.sin(p*Math.PI)}
else if(chat){a=stage==='peek-left'?9:stage==='peek-right'?-9:4*Math.sin(now/900);y=stage==='duck'?8:-3+3*Math.sin(now/1000)}
else if(talking){a=6*Math.sin(now/450);y=4*Math.sin(now/330)}else if(listen){a=-7;y=-5}else if(think){a=8;y=2}else{a=2.5*Math.sin(now/1800);y=2*Math.sin(now/1200)}
const k=1-Math.exp(-dt*6);tilt+=(a-tilt)*k;lift+=(y-lift)*k;shell.setAttribute('transform',`translate(0 ${lift.toFixed(2)}) rotate(${tilt.toFixed(2)} 320 465)`);
}requestAnimationFrame(frame);
})();
