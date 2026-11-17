/* Vivi 3.7 – restrained, responsive 2D life motion; no speech/AI modifications. */
(()=>{'use strict';
const start=()=>{
 const figure=document.getElementById('vincent');
 const art=document.getElementById('vivi-classic-art');
 if(!figure||!art)return;
 if(figure.dataset.viviAlive==='1')return;
 figure.dataset.viviAlive='1';
 const style=document.createElement('style');
 style.textContent=`
 #vincent.figure{--vivi-tilt:0deg;--vivi-shift:0px;perspective:900px}
 #vivi-classic-art{animation:viviAliveBreath 6.8s ease-in-out infinite!important;transform-origin:50% 74%!important;transition:filter .6s ease!important;backface-visibility:hidden}
 @keyframes viviAliveBreath{
  0%,100%{transform:translate3d(var(--vivi-shift),1px,0) rotate(var(--vivi-tilt)) scale(1)}
  25%{transform:translate3d(var(--vivi-shift),-1px,0) rotate(var(--vivi-tilt)) scale(1.003)}
  50%{transform:translate3d(var(--vivi-shift),-3px,0) rotate(var(--vivi-tilt)) scale(1.007)}
  75%{transform:translate3d(var(--vivi-shift),-1px,0) rotate(var(--vivi-tilt)) scale(1.004)}
 }
 #vincent.talking #vivi-classic-art,#vincent.audio-speaking #vivi-classic-art{animation:none!important}
 @keyframes viviAliveTalking{
  0%,100%{transform:translate3d(var(--vivi-shift),0,0) rotate(var(--vivi-tilt)) scale(1)}
  24%{transform:translate3d(var(--vivi-shift),-2px,0) rotate(calc(var(--vivi-tilt) + .3deg)) scale(1.004)}
  55%{transform:translate3d(var(--vivi-shift),-1px,0) rotate(calc(var(--vivi-tilt) - .25deg)) scale(1.002)}
  78%{transform:translate3d(var(--vivi-shift),-3px,0) rotate(var(--vivi-tilt)) scale(1.006)}
 }
 #vincent.listening #vivi-classic-art{animation:viviAliveListen 5s ease-in-out infinite!important}
 @keyframes viviAliveListen{0%,100%{transform:translateY(0) rotate(.2deg)}45%{transform:translateY(-2px) rotate(1deg)}}
 #vincent.thinking #vivi-classic-art{animation:viviAliveThink 6.5s ease-in-out infinite!important}
 @keyframes viviAliveThink{0%,100%{transform:translateY(0) rotate(-.4deg)}50%{transform:translateY(-2px) rotate(-1.25deg)}}
 #vincent.vincent-sleeping #vivi-classic-art{animation:viviAliveBreath 9s ease-in-out infinite!important;filter:brightness(.75) drop-shadow(0 8px 16px #0008)}
 #vincent.figure::before{animation:viviAliveGlow 7s ease-in-out infinite alternate!important}
 @keyframes viviAliveGlow{from{opacity:.38;transform:scale(.95)}to{opacity:.82;transform:scale(1.07)}}
 @media(prefers-reduced-motion:reduce){#vivi-classic-art,#vincent.figure::before{animation:none!important;transform:none!important}}
 `;
 document.head.appendChild(style);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let last=0;
 function motion(){
  if(document.hidden||reduced?.matches)return;
  const active=figure.classList.contains('talking')||figure.classList.contains('audio-speaking')||figure.classList.contains('listening')||figure.classList.contains('thinking');
  if(!active){
   const tilt=(Math.random()*1.4-.7).toFixed(2)+'deg';
   const shift=(Math.random()*3-1.5).toFixed(1)+'px';
   figure.style.setProperty('--vivi-tilt',tilt);
   figure.style.setProperty('--vivi-shift',shift);
  }
  last=Date.now();
 }
 motion();
 // Irregular, slow micro-adjustments avoid a mechanical repeating head movement.
 const timer=setInterval(motion,6500);
 window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 const badge=document.getElementById('vincent-build');
 if(badge)badge.textContent='Vivi 4.4 · Lokale weibliche Stimme';
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
