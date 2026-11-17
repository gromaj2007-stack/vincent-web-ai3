(()=>{'use strict';
const host=document.getElementById('vincent'),rig=document.querySelector('.vivi-rig-v28');if(!host||!rig)return;
const part=n=>rig.querySelector('.v28-'+n);const all=['head','hair-left','hair-right','left-upper-arm','right-upper-arm','left-forearm','right-forearm','left-hand','right-hand','left-thigh','right-thigh','left-boot','right-boot'];
let last=performance.now(),blinkAt=last+1900,blinkUntil=0,gesture='',gestureUntil=0;
const oldGesture=window.viviMotionGesture;window.viviMotionGesture=(name,duration=1600)=>{oldGesture?.(name,duration);gesture=name;gestureUntil=performance.now()+duration;};
function pose(n,angle,lift=0){const el=part(n);if(el){el.style.setProperty('--angle',angle.toFixed(2)+'deg');el.style.setProperty('--lift',lift.toFixed(2)+'px')}}
function frame(t){requestAnimationFrame(frame);if(document.hidden)return;const dt=Math.min(.1,(t-last)/1000);last=t;
const speak=host.classList.contains('talking')||host.classList.contains('audio-speaking'),listen=host.classList.contains('listening'),think=host.classList.contains('thinking'),happy=host.classList.contains('rig-happy')||(t<gestureUntil&&gesture==='happy');
const s=Math.sin(t/700),b=Math.sin(t/1250),wave=Math.sin(t/260);const motion=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:1;
pose('head',motion*((listen?-3:think?3:0)+1.5*b+(speak?1.5*wave:0)));
pose('hair-left',motion*(1.7*Math.sin(t/900)+1.0*b));pose('hair-right',motion*(-1.9*Math.sin(t/1030)-1.1*b));
pose('left-upper-arm',motion*((listen?3:0)+1.1*s));pose('right-upper-arm',motion*((happy?-6:0)+(speak?-3:0)-1.1*s));
pose('left-forearm',motion*((listen?-4:0)+1.6*b));pose('right-forearm',motion*((speak?5*wave:0)+(happy?-6:0)+1.2*b));
pose('left-hand',motion*(1.5*s));pose('right-hand',motion*(speak?3*wave:1.5*b));
pose('left-thigh',motion*.45*s);pose('right-thigh',motion*-.45*s);
pose('left-boot',motion*.25*b);pose('right-boot',motion*-.25*b);
if(t>blinkAt){blinkUntil=t+125;blinkAt=t+2700+Math.random()*3800}rig.classList.toggle('blink',t<blinkUntil);
}requestAnimationFrame(frame);
})();