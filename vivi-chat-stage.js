/* Vivi 2.0.9 – chat choreography: appear, hide, peek left/right. */
(()=>{'use strict';const main=document.querySelector('main'),figure=document.getElementById('vincent');if(!main||!figure)return;
let open=false,phase='center',timer=0,lastAction=0,seq=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function stage(next){phase=next;main.dataset.viviStage=next;figure.dataset.viviStage=next;}
function schedule(ms){clearTimeout(timer);if(!open||reduce.matches)return;timer=setTimeout(next,ms);}
function next(){if(!open)return;const now=performance.now();if(now-lastAction<3500){schedule(4000);return;}
const states=phase==='center'?['duck','peek-left','peek-right']:phase==='duck'?['peek-left','peek-right']:['center','duck'];
const dest=states[seq++%states.length];stage(dest);schedule(dest==='duck'?750:dest==='center'?6000:3800);
}
function setOpen(value){open=!!value;clearTimeout(timer);stage(open?'center':'closed');if(open){lastAction=performance.now();schedule(5700);}}
const observer=new MutationObserver(()=>setOpen(main.classList.contains('chat-open')));
observer.observe(main,{attributes:true,attributeFilter:['class']});setOpen(main.classList.contains('chat-open'));
window.viviChatStage={open:setOpen,peek(side){if(!open)return;stage(side==='right'?'peek-right':'peek-left');schedule(3700);},surprise(){if(!open)return;stage('duck');schedule(800);},activity(){lastAction=performance.now();if(open&&phase==='duck')stage('center');schedule(6200);}};
const log=document.getElementById('chat-log'),keys=document.getElementById('chat-keys');
keys?.addEventListener('pointerdown',()=>window.viviChatStage.activity(),{passive:true});
new MutationObserver(()=>{if(open&&log?.lastElementChild?.classList.contains('vincent')){stage('center');lastAction=performance.now();schedule(5500);}}).observe(log||main,{childList:true});
})();
