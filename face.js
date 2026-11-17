/* Vincent Companion Face v3: calm, context-driven, smoothly interpolated. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg');if(!host||!svg)return;
const NS='http://www.w3.org/2000/svg';function add(tag,attrs,parent=svg){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e}
svg.querySelectorAll('.eye').forEach(e=>e.style.display='none');const old=svg.querySelector('#mouth');if(old)old.style.display='none';
const g=add('g',{id:'vincent-companion-face'});const glow='#62eaff';
const eyes=[add('path',{fill:glow},g),add('path',{fill:glow},g)];const brows=[add('path',{fill:'none',stroke:glow,'stroke-width':5,'stroke-linecap':'round',opacity:'.68'},g),add('path',{fill:'none',stroke:glow,'stroke-width':5,'stroke-linecap':'round',opacity:'.68'},g)];const mouth=add('path',{stroke:glow,'stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'},g);const cheeks=[add('ellipse',{cx:196,cy:366,rx:16,ry:8,fill:'#fa8bb4',opacity:0},g),add('ellipse',{cx:444,cy:366,rx:16,ry:8,fill:'#fa8bb4',opacity:0},g)];
// Values are continuous, not jump-cut poses. Eyes stay within the original screen.
const poses={
 neutral:{eye:1,smile:.32,brow:0,blush:0,gaze:0},
 listening:{eye:1.08,smile:.25,brow:-3,blush:0,gaze:0},
 thinking:{eye:.91,smile:.08,brow:2,blush:0,gaze:5},
 happy:{eye:.82,smile:.9,brow:-2,blush:0,gaze:0},
 delighted:{eye:.75,smile:1.12,brow:-5,blush:.1,gaze:0},
 shy:{eye:.82,smile:.45,brow:3,blush:.6,gaze:-5},
 hurt:{eye:.86,smile:-.45,brow:5,blush:0,gaze:-3},
 sad:{eye:.82,smile:-.52,brow:5,blush:0,gaze:-4},
 surprised:{eye:1.15,smile:0,brow:-9,blush:0,gaze:0},
 curious:{eye:1.03,smile:.3,brow:-3,blush:0,gaze:4},
 skeptical:{eye:.88,smile:.05,brow:4,blush:0,gaze:3},
 playful:{eye:.87,smile:.76,brow:-1,blush:0,gaze:2},
 sleepy:{eye:.65,smile:.15,brow:3,blush:0,gaze:0}
};
let emotion='neutral',emotionUntil=0,blinkStart=0,nextBlink=performance.now()+3100,blinkDuration=180,nextLook=performance.now()+6500,look=0,open=0,last=performance.now();
const cur={...poses.neutral,gaze:0,blink:0,open:0};
function feel(name,duration=2400){if(!poses[name])return;emotion=name;emotionUntil=performance.now()+Math.max(300,Math.min(duration,6500))}
window.vincentFeel=feel;
window.vincentReactToText=(value)=>{const t=String(value||'').toLowerCase();let mood=null;
// Do not confuse words in an ordinary sentence with Vincent's own feelings.
if(/(?:das tut mir leid|entschuldige|schade|traurig|bedauerlich)/.test(t))mood='sad';
else if(/(?:oh je|ups|peinlich|verlegen)/.test(t))mood='shy';
else if(/(?:wow|unglaublich|oha|überraschung)/.test(t))mood='surprised';
else if(/(?:haha|hehe|hihi|kleiner scherz)/.test(t))mood='playful';
else if(/(?:freut mich|wunderbar|großartig|super gemacht|klasse gemacht)/.test(t))mood='happy';
if(mood)feel(mood,Math.min(5500,2400+t.length*11));
};
const lerp=(a,b,k)=>a+(b-a)*k;
function eyeD(cx,cy,height){const h=Math.max(2,height)/2,w=30;return `M ${cx-w} ${cy} C ${cx-w} ${cy-h*1.3} ${cx+w} ${cy-h*1.3} ${cx+w} ${cy} C ${cx+w} ${cy+h*1.3} ${cx-w} ${cy+h*1.3} ${cx-w} ${cy} Z`}
function frame(now){requestAnimationFrame(frame);if(document.hidden){last=now;return}const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
const talking=host.classList.contains('talking')||host.classList.contains('audio-speaking');const thinking=host.classList.contains('thinking');const listening=host.classList.contains('listening');
let pose=poses.neutral;if(thinking)pose=poses.thinking;else if(listening)pose=poses.listening;else if(now<emotionUntil)pose=poses[emotion];
if(now>=nextBlink){blinkStart=now;blinkDuration=170+Math.random()*70;nextBlink=now+3600+Math.random()*3500}
const elapsed=now-blinkStart;const blink=elapsed>=0&&elapsed<blinkDuration?Math.sin(Math.PI*elapsed/blinkDuration):0;
if(now>=nextLook){look=(thinking||listening||talking)?0:(Math.random()<.8?0:(Math.random()-.5)*3);nextLook=now+6500+Math.random()*6000}
// No random emotions. Only calm eye micro-movements and conversation-driven expressions.
// Smooth exponential easing is frame-rate independent.
const k=1-Math.exp(-dt*3.5);for(const prop of ['eye','smile','brow','blush'])cur[prop]=lerp(cur[prop],pose[prop],k);
cur.gaze=lerp(cur.gaze,pose.gaze+look,1-Math.exp(-dt*1.7));cur.blink=lerp(cur.blink,blink,1-Math.exp(-dt*28));
let targetOpen=0;if(talking){const raw=parseFloat(host.style.getPropertyValue('--audio-mouth-scale'));targetOpen=host.classList.contains('audio-speaking')&&Number.isFinite(raw)?Math.max(.1,Math.min(.95,(raw-.3)/1.8)):.10+.25*(.5+.5*Math.sin(now/190));}else if(now<emotionUntil&&emotion==='surprised')targetOpen=.38;
cur.open=lerp(cur.open,targetOpen,1-Math.exp(-dt*8));
const eyeHeight=112*cur.eye*(1-.97*cur.blink);eyes[0].setAttribute('d',eyeD(246+cur.gaze,285,eyeHeight));eyes[1].setAttribute('d',eyeD(394+cur.gaze,285,eyeHeight));
brows[0].setAttribute('d',`M 219 ${211+cur.brow} Q 246 ${204+cur.brow} 274 ${211+cur.brow}`);brows[1].setAttribute('d',`M 366 ${211+cur.brow} Q 394 ${204+cur.brow} 421 ${211+cur.brow}`);
cheeks.forEach(e=>e.setAttribute('opacity',String(Math.max(0,cur.blush)*.38)));
const corner=390-11*cur.smile,mid=390+14*cur.smile,wide=48;
if(cur.open>.035){const depth=6+cur.open*36;mouth.setAttribute('d',`M ${320-wide} ${corner} Q 320 ${mid} ${320+wide} ${corner} Q 320 ${mid+depth} ${320-wide} ${corner} Z`);mouth.setAttribute('fill',glow)}else{mouth.setAttribute('d',`M ${320-wide} ${corner} Q 320 ${mid+4} ${320+wide} ${corner}`);mouth.setAttribute('fill','none')}
}
requestAnimationFrame(frame);
})();
