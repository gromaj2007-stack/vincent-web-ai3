/* Vivi 2.1.2 — gentle, interruptible idle behaviour. No automatic speech. */
(()=>{'use strict';
const host=document.getElementById('vincent');if(!host)return;
let next=performance.now()+3600,until=0,mode='rest',last=performance.now(),gaze=0,desired=0;
const choices=[['look-left',1.9],['look-right',1.9],['tilt-left',1.3],['tilt-right',1.3],['curious',1.1],['shy',.65],['rest',2.8]];
function choose(){const sum=choices.reduce((n,v)=>n+v[1],0);let r=Math.random()*sum;for(const [name,w] of choices){r-=w;if(r<=0)return name}return 'rest'}
function busy(){return document.hidden||host.classList.contains('talking')||host.classList.contains('audio-speaking')||host.classList.contains('listening')||host.classList.contains('thinking')||host.classList.contains('vincent-sleeping')}
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.06,Math.max(0,(now-last)/1000));last=now;
if(busy()){mode='rest';desired=0;until=0;next=now+3500;window.viviIdlePose='rest';return}
if(now>=next){mode=choose();until=now+1100+Math.random()*2400;next=until+1800+Math.random()*6100;
if(mode==='curious')window.vincentFeel?.('curious',1700);
if(mode==='shy')window.vincentFeel?.('shy',1700);
}
if(now>until)mode='rest';
const chat=document.querySelector('main')?.classList.contains('chat-open');
window.viviIdlePose=mode;
desired=mode==='look-left'?-16:mode==='look-right'?16:mode==='curious'?6:mode==='shy'?-5:0;
const k=1-Math.exp(-dt*2.6);gaze+=(desired-gaze)*k;
window.viviIdleGaze=gaze;
}
requestAnimationFrame(tick);
})();