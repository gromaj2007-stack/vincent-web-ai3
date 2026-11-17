/* Vivi 2.0.8: one motion director for the whole robot. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg'),panel=document.getElementById('vincent-chat');
if(!host||!svg)return;
const NS='http://www.w3.org/2000/svg';
const make=(tag,attrs,parent)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.append(n);return n;};
// Put the real head, headphones and face in one articulated group, leaving the jacket behind.
const shell=make('g',{id:'vivi-articulated-head'},svg);
const children=[...svg.children];
const firstHead=children.findIndex(n=>n.tagName.toLowerCase()==='rect'&&n.getAttribute('x')==='252'&&n.getAttribute('y')==='449');
const face=svg.querySelector('#vincent-companion-face');
if(firstHead>=0){
  for(const n of children.slice(firstHead)){if(n!==shell&&n!==face)shell.append(n);}
  if(face)shell.append(face);
}
const shine=make('g',{id:'vivi-kawaii-shine','pointer-events':'none'},shell);
const stars=[];
for(const [x,y] of [[185,177],[465,175],[475,347]]){
 const star=make('path',{d:`M ${x} ${y-10} Q ${x+3} ${y-3} ${x+10} ${y} Q ${x+3} ${y+3} ${x} ${y+10} Q ${x-3} ${y+3} ${x-10} ${y} Q ${x-3} ${y-3} ${x} ${y-10} Z`,fill:'#e7caff',opacity:'0'},shine);stars.push(star);
}
let chat=false,typingUntil=0,emotion='neutral',emotionUntil=0,wakeUntil=0,speechUntil=0;
const original=window.vincentController;
if(original){
 const oldChat=original.chat?.bind(original),oldTyping=original.typing?.bind(original),oldMessage=original.message?.bind(original);
 original.chat=open=>{oldChat?.(open);chat=!!open;emotion='curious';emotionUntil=performance.now()+1800;};
 original.typing=()=>{oldTyping?.();typingUntil=performance.now()+1250;};
 original.message=text=>{oldMessage?.(text);respond(text);};
}
function respond(text){
 const t=String(text||'').toLowerCase();
 emotion=/traurig|schade|tut mir leid|entschuldig/.test(t)?'sad':/wow|unglaublich|oha/.test(t)?'surprised':/freu|super|toll|klasse|haha|hihi/.test(t)?'delighted':/\?/.test(t)?'curious':'playful';
 emotionUntil=performance.now()+Math.min(6500,2100+t.length*35);
 window.vincentFeel?.(emotion,Math.min(6500,2100+t.length*35));
}
const oldReact=window.vincentReactToText;
window.vincentReactToText=text=>{oldReact?.(text);respond(text);speechUntil=performance.now()+Math.min(16000,2500+String(text||'').length*75);};
const oldWake=window.vincentWake;
window.vincentWake=()=>{oldWake?.();wakeUntil=performance.now()+2200;window.vincentFeel?.('delighted',2000);};
let angle=0,y=0,x=0,headAngle=0,headY=0,scale=1,last=performance.now();
const ease=(a,b,dt,k)=>a+(b-a)*(1-Math.exp(-k*dt));
function animate(now){
 requestAnimationFrame(animate);
 const dt=Math.min(.06,Math.max(0,(now-last)/1000));last=now;
 if(document.hidden)return;
 const chatOpen=chat||(!panel?.hidden),typing=now<typingUntil,sleep=host.classList.contains('vincent-sleeping');
 const speaking=host.classList.contains('talking')||host.classList.contains('audio-speaking');
 const thinking=host.classList.contains('thinking'),listening=host.classList.contains('listening'),waking=now<wakeUntil;
 const active=now<emotionUntil;
 let ty=0,tx=0,ta=0,ts=1,ha=0,hy=0;
 if(sleep){ty=7;ha=-6;hy=6;}
 else if(waking){const p=1-(wakeUntil-now)/2200;ty=-22*Math.sin(Math.PI*p);ta=9*Math.sin(2*Math.PI*p);ha=12*Math.sin(Math.PI*p);}
 else if(chatOpen){
   // Stage is positioned over the actual panel; nods and peeks are unmistakable.
   ty=typing?28:12+7*Math.sin(now/700);
   tx=typing?11*Math.sin(now/380):7*Math.sin(now/1450);
   ta=typing?-7:5*Math.sin(now/1300);
   ts=typing?1.13:1.08;
   ha=typing?-9:6*Math.sin(now/1050);
   hy=typing?12:3*Math.sin(now/900);
 }else if(speaking){ty=-5+8*Math.sin(now/310);ta=7*Math.sin(now/510);ha=5*Math.sin(now/420);hy=3*Math.sin(now/280);}
 else if(listening){ty=-9;ta=4;ha=-7;}
 else if(thinking){ty=4;ta=-5;ha=9;}
 else if(active){ty=-8+4*Math.sin(now/490);ta=emotion==='shy'?-9:emotion==='surprised'?8:4;ha=emotion==='curious'?11:-3;}
 else{ty=5*Math.sin(now/1250);ta=2.8*Math.sin(now/2200);ha=2.5*Math.sin(now/1800);}
 angle=ease(angle,ta,dt,6.2);y=ease(y,ty,dt,5.8);x=ease(x,tx,dt,6);scale=ease(scale,ts,dt,4.8);headAngle=ease(headAngle,ha,dt,6);headY=ease(headY,hy,dt,5);
 // Transform the actual head, not only the floating SVG face.
 shell.setAttribute('transform',`translate(0 ${headY.toFixed(1)}) rotate(${headAngle.toFixed(1)} 320 475)`);
 host.style.setProperty('--vivi-stage-x',`${x.toFixed(1)}px`);
 host.style.setProperty('--vivi-stage-y',`${y.toFixed(1)}px`);
 host.style.setProperty('--vivi-stage-angle',`${angle.toFixed(1)}deg`);
 host.style.setProperty('--vivi-stage-scale',scale.toFixed(3));
 host.classList.toggle('vivi-chat-lean',chatOpen);
 host.classList.toggle('vivi-chat-typing',chatOpen&&typing);
 const glow=active&&['delighted','happy','playful','surprised'].includes(emotion);
 stars.forEach((n,i)=>n.setAttribute('opacity',String(glow?(0.45+0.4*Math.sin(now/180+i)**2):0)));
}
requestAnimationFrame(animate);
})();
