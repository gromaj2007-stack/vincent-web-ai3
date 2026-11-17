/* Vivi Alive 2.0.5 – dedicated gesture / emotion director. SVG stays editable and lightweight. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg'),panel=document.getElementById('vincent-chat');if(!host||!svg)return;
const ns='http://www.w3.org/2000/svg';const mk=(tag,attrs,parent)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e};
const left=mk('g',{id:'vivi-left-hand'},svg),right=mk('g',{id:'vivi-right-hand'},svg);
function hand(group,flip){const cx=flip?526:114;mk('path',{d:`M ${cx} 578 Q ${cx+(flip?-29:29)} 550 ${cx+(flip?-34:34)} 525`,stroke:'#263b49','stroke-width':'27',fill:'none','stroke-linecap':'round'},group);mk('ellipse',{cx:cx+(flip?-34:34),cy:519,rx:23,ry:24,fill:'#3b5260',stroke:'#8aa8b1','stroke-width':3},group);mk('ellipse',{cx:cx+(flip?-39:39),cy:514,rx:9,ry:10,fill:'#6e8c98',opacity:'.65'},group)}hand(left,false);hand(right,true);
const sparkle=mk('g',{id:'vivi-sparkles',opacity:'0'},svg);for(const [x,y,r] of [[171,185,12],[479,199,9],[492,351,8]])mk('path',{d:`M ${x} ${y-r} Q ${x+2} ${y-2} ${x+r} ${y} Q ${x+2} ${y+2} ${x} ${y+r} Q ${x-2} ${y+2} ${x-r} ${y} Q ${x-2} ${y-2} ${x} ${y-r}`,fill:'#b2f5ff'},sparkle);
const bow=mk('path',{d:'M 305 538 Q 320 531 335 538',fill:'none',stroke:'#ff9acb','stroke-width':4,opacity:'.85'},svg);
let last=performance.now(),mood='neutral',moodEnd=0,chat=false,typingEnd=0,wakeEnd=0,lastSpeech=false,lastSleep=false,gesture='idle',gestureEnd=0;
const choose=(name,duration=1900)=>{mood=name;moodEnd=performance.now()+duration;window.vincentFeel?.(name,duration)};
const originalChat=window.vincentController?.chat?.bind(window.vincentController);
const originalTyping=window.vincentController?.typing?.bind(window.vincentController);
const originalMessage=window.vincentController?.message?.bind(window.vincentController);
if(window.vincentController){window.vincentController.chat=(opened)=>{originalChat?.(opened);chat=!!opened;gesture='chat';gestureEnd=performance.now()+1000};window.vincentController.typing=()=>{originalTyping?.();typingEnd=performance.now()+900};window.vincentController.message=(text)=>{originalMessage?.(text);const t=String(text).toLowerCase();const m=/haha|hihi|lustig|freu|super|toll/.test(t)?'delighted':/leid|traurig|schade/.test(t)?'sad':/wow|oha|krass/.test(t)?'surprised':/\?/.test(t)?'curious':'playful';choose(m,2700);gesture='reply';gestureEnd=performance.now()+3200;};}
const oldWake=window.vincentWake;window.vincentWake=()=>{oldWake?.();wakeEnd=performance.now()+2500;gesture='wake';gestureEnd=wakeEnd;choose('delighted',2500)};
// Reactions to spoken answers, not only chat replies.
const oldReact=window.vincentReactToText;window.vincentReactToText=(text)=>{oldReact?.(text);const t=String(text).toLowerCase();const m=/freu|super|wunderbar|klasse|haha|hihi/.test(t)?'happy':/tut mir leid|traurig|schade/.test(t)?'sad':/wow|oha|unglaublich/.test(t)?'surprised':/\?/.test(t)?'curious':'playful';choose(m,2600);gesture='reply';gestureEnd=performance.now()+3100};
// Soft, original waking chime; only after a user gesture has unlocked Web Audio.
let audio=null,unlocked=false;document.addEventListener('pointerdown',()=>{unlocked=true},{passive:true});
function chirp(){if(!unlocked)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audio ||=new AC();if(audio.state==='suspended')audio.resume();const start=audio.currentTime;for(const [i,f] of [[0,523],[1,659],[2,784]]){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,start+i*.105);g.gain.setValueAtTime(.0001,start+i*.105);g.gain.exponentialRampToValueAtTime(.045,start+i*.105+.025);g.gain.exponentialRampToValueAtTime(.0001,start+i*.105+.18);o.connect(g).connect(audio.destination);o.start(start+i*.105);o.stop(start+i*.105+.2)}}catch{}}
const wakeHook=window.vincentWake;window.vincentWake=()=>{wakeHook?.();chirp()};
const smooth=(x,target,dt,speed)=>x+(target-x)*(1-Math.exp(-dt*speed));let l=0,r=0,s=0,shift=0,angle=0;
function tick(now){requestAnimationFrame(tick);const dt=Math.min(.055,(now-last)/1000||0);last=now;if(document.hidden)return;
const sleeping=host.classList.contains('vincent-sleeping'),speaking=host.classList.contains('talking')||host.classList.contains('audio-speaking'),thinking=host.classList.contains('thinking'),listening=host.classList.contains('listening');
if(lastSleep&&!sleeping){wakeEnd=now+2200;gesture='wake';gestureEnd=wakeEnd;chirp()}lastSleep=sleeping;
if(!lastSpeech&&speaking){gesture='talk';gestureEnd=now+1800}lastSpeech=speaking;
const chatOpen=chat||(!panel?.hidden),active=now<gestureEnd,typing=now<typingEnd,waking=now<wakeEnd;
let lt=0,rt=0,st=0,at=0,dy=0;
if(sleeping){lt=-10;rt=10;st=0;at=-2;dy=4}
else if(waking){const p=1-(wakeEnd-now)/2400;lt=-35*Math.sin(p*Math.PI);rt=35*Math.sin(p*Math.PI);st=1;at=Math.sin(p*Math.PI*2)*3;dy=-7*Math.sin(p*Math.PI)}
else if(chatOpen){lt=-28+Math.sin(now/420)*3;rt=28+Math.sin(now/470)*3;st=.6;at=typing?3:Math.sin(now/1250)*2.5;dy=typing?-7:-4+Math.sin(now/650)*2}
else if(speaking){lt=-14+Math.sin(now/210)*12;rt=14+Math.sin(now/290)*14;st=.8;at=Math.sin(now/390)*2.7;dy=Math.sin(now/360)*3}
else if(listening){lt=-20;rt=20;at=4;dy=-4}
else if(thinking){lt=7;rt=-15;at=-4;dy=-2}
else if(active){lt=-25;rt=30;at=4;dy=-4}
else{lt=Math.sin(now/1400)*5;rt=-Math.sin(now/1550)*5;at=Math.sin(now/2500)*1.4;dy=Math.sin(now/1100)*2.5}
l=smooth(l,lt,dt,6);r=smooth(r,rt,dt,6);s=smooth(s,st,dt,5);angle=smooth(angle,at,dt,3.8);shift=smooth(shift,dy,dt,4.5);
left.setAttribute('transform',`rotate(${l.toFixed(2)} 114 578)`);right.setAttribute('transform',`rotate(${r.toFixed(2)} 526 578)`);
// Full-body lean is applied to the existing figure, independently of facial expressions.
host.style.setProperty('--vivi-lean',`${angle.toFixed(2)}deg`);host.style.setProperty('--vivi-lift',`${shift.toFixed(2)}px`);
sparkle.setAttribute('opacity',String((now<moodEnd&&['happy','delighted','surprised','playful'].includes(mood))?(.45+.4*Math.sin(now/200)**2):0));
}
requestAnimationFrame(tick);
})();
