/* Vivi 2.1.1 — independent chat choreography, safe head-only peeks. */
(()=>{'use strict';
const main=document.querySelector('main'),figure=document.getElementById('vincent');
if(!main||!figure)return;
let open=false,phase='center',timer=null,step=0,lastInput=0;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const states=['center','peek-left','center','duck','peek-right','center','peek-left','center','duck','peek-right'];
function setPhase(value){
 phase=value;main.dataset.viviStage=value;
 figure.dataset.viviStage=value;
 window.viviMotionGesture?.(value==='peek-left'?'curious':value==='peek-right'?'playful':value==='duck'?'shy':'happy',1250);
}
function schedule(ms){clearTimeout(timer);if(!open||reduce.matches)return;timer=setTimeout(advance,ms)}
function advance(){
 if(!open)return;
 if(performance.now()-lastInput<2200){schedule(2600);return}
 const value=states[(step++)%states.length];setPhase(value);
 schedule(value==='duck'?900:value.startsWith('peek')?2600:3500);
}
function setOpen(next){
 const value=!!next;
 if(value===open)return;
 open=value;clearTimeout(timer);step=0;
 setPhase(open?'center':'closed');
 if(open){lastInput=performance.now();schedule(3600)}
}
new MutationObserver(()=>setOpen(main.classList.contains('chat-open')))
 .observe(main,{attributes:true,attributeFilter:['class']});
setOpen(main.classList.contains('chat-open'));
window.viviChatStage={
 open:setOpen,
 peek(side){if(!open)return;setPhase(side==='right'?'peek-right':'peek-left');schedule(2700)},
 surprise(){if(!open)return;setPhase('duck');schedule(900)},
 activity(){lastInput=performance.now();if(open){setPhase('center');schedule(3700)}}
};
document.getElementById('chat-keys')?.addEventListener('pointerdown',()=>window.viviChatStage.activity(),{passive:true});
const log=document.getElementById('chat-log');
if(log)new MutationObserver(()=>{if(open){setPhase('center');schedule(3500)}}).observe(log,{childList:true});
})();
