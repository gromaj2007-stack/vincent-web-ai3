/* Vivi 2.1.3 — chat choreography with staged shy peeks. */
(()=>{'use strict';
const main=document.querySelector('main'),host=document.getElementById('vincent');if(!main||!host)return;
let open=false,timer=0,lastActivity=0,sequence=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function pose(name){main.dataset.viviStage=name;window.viviMotionGesture?.(name.startsWith('shy')?'shy':name.startsWith('peek')?'curious':'happy',1600)}
function wait(ms,fn){clearTimeout(timer);if(open&&!reduced.matches)timer=setTimeout(fn,ms)}
function idle(){if(!open)return;if(performance.now()-lastActivity<3500){wait(2500,idle);return}
 const n=sequence++%4;
 if(n===0){pose('shy-low');wait(1550,()=>{pose('shy-peek');wait(2100,()=>{pose('center');wait(4900,idle)})})}
 else if(n===1){pose('peek-left');wait(3200,()=>{pose('center');wait(5800,idle)})}
 else if(n===2){pose('shy-low');wait(1200,()=>{pose('peek-right');wait(2900,()=>{pose('center');wait(5800,idle)})})}
 else{pose('center');wait(7500,idle)}
}
function setOpen(value){if(open===value)return;open=value;clearTimeout(timer);pose(open?'shy-peek':'closed');if(open){lastActivity=performance.now();wait(2100,()=>{pose('center');wait(5200,idle)})}}
new MutationObserver(()=>setOpen(main.classList.contains('chat-open'))).observe(main,{attributes:true,attributeFilter:['class']});
setOpen(main.classList.contains('chat-open'));
window.viviChatStage={open:setOpen,peek(side){if(!open)return;pose(side==='right'?'peek-right':'peek-left');wait(2600,()=>{pose('center');wait(5500,idle)})},surprise(){if(!open)return;pose('shy-low');wait(1400,()=>{pose('shy-peek');wait(2200,idle)})},activity(){lastActivity=performance.now();if(open){pose('center');wait(5600,idle)}}};
document.getElementById('chat-keys')?.addEventListener('pointerdown',()=>window.viviChatStage.activity(),{passive:true});
document.getElementById('chat-log')&&new MutationObserver(()=>{if(open)window.viviChatStage.activity()}).observe(document.getElementById('chat-log'),{childList:true});
})();
