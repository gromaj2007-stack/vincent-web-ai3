/* Vivi 2.9 face alignment patch. Load after vivi-rig-v28.js. */
(()=>{'use strict';
 const rig=document.querySelector('#vivi-rig.vivi-rig-v28');if(!rig)return;
 const style=document.createElement('style');style.textContent=`
 #vivi-rig.vivi-rig-v28 .rig-face-mouth{left:43.8%!important;top:39.5%!important;width:12.5%!important;height:6.5%!important;transform:none!important;animation:none!important;transform-origin:center!important;z-index:15!important;pointer-events:none!important}
 #vivi-rig.vivi-rig-v28 .v28-eyelid{top:30.8%!important;height:8.2%!important;width:7.7%!important;border-radius:48%!important;transform-origin:50% 12%!important;transition:transform 105ms ease-in-out!important;opacity:.96!important;}
 #vivi-rig.vivi-rig-v28 .v28-eye-l{left:36.1%!important}
 #vivi-rig.vivi-rig-v28 .v28-eye-r{left:51.5%!important}
 #vivi-rig.vivi-rig-v28:not(.blink) .v28-eyelid{transform:scaleY(0)!important}
 #vivi-rig.vivi-rig-v28.blink .v28-eyelid{transform:scaleY(1)!important}
 `;document.head.append(style);
 // Move the mouth with the same head tilt; no duplicate mouth overlay.
 const mouth=rig.querySelector('.rig-face-mouth');const head=rig.querySelector('.v28-head');
 if(mouth&&head){let id;const tick=()=>{const transform=getComputedStyle(head).transform;mouth.style.setProperty('transform',transform==='none'?'none':transform,'important');id=requestAnimationFrame(tick)};id=requestAnimationFrame(tick);window.addEventListener('pagehide',()=>cancelAnimationFrame(id),{once:true});}
})();
