/* Vincent Companion Face v3: calm, context-driven, smoothly interpolated. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg');if(!host||!svg)return;
const NS='http://www.w3.org/2000/svg';function add(tag,attrs,parent=svg){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e}
svg.querySelectorAll('.eye').forEach(e=>e.style.display='none');const old=svg.querySelector('#mouth');if(old)old.style.display='none';
const g=add('g',{id:'vincent-companion-face'});const glow='#b98aff';
const eyes=[add('path',{fill:glow},g),add('path',{fill:glow},g)];const brows=[add('path',{fill:'none',stroke:glow,'stroke-width':5,'stroke-linecap':'round',opacity:'.68'},g),add('path',{fill:'none',stroke:glow,'stroke-width':5,'stroke-linecap':'round',opacity:'.68'},g)];const mouth=add('path',{stroke:glow,'stroke-width':5,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'},g);const cheeks=[add('ellipse',{cx:196,cy:366,rx:21,ry:11,fill:'#c9a0ff',opacity:0},g),add('ellipse',{cx:444,cy:366,rx:21,ry:11,fill:'#c9a0ff',opacity:0},g)];
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
 sleepy:{eye:.06,smile:.28,brow:2,blush:0,gaze:0},
 checking:{eye:1.05,smile:.12,brow:-6,blush:0,gaze:0}
};
let speechText='',speechStarted=0,speechMood='playful';window.viviSpeechEmotion=(text)=>{speechText=String(text||'').toLowerCase();speechStarted=performance.now();speechMood=/traurig|schade|leid|sorry|entschuldige/.test(speechText)?'sad':/wow|unglaublich|überrasch/.test(speechText)?'surprised':/freu|super|klasse|toll|juhu/.test(speechText)?'delighted':/\?/.test(speechText)?'curious':'playful';feel(speechMood,4200)};let chatPose='neutral',chatUntil=0;window.vincentChatPose=(name,duration=1200)=>{chatPose=name;chatUntil=performance.now()+Math.max(200,duration)};
let wakeStart=0;window.vincentWake=()=>{wakeStart=performance.now();feel('delighted',2200)};
let mode='awake';
window.vincentSetMode=(value)=>{if(['awake','checking','sleep'].includes(value)){mode=value;if(value!=='awake'){emotionUntil=0;look=0;}}};
let emotion='neutral',emotionUntil=0,blinkStart=0,nextBlink=performance.now()+3100,blinkDuration=180,nextLook=performance.now()+6500,look=0,open=0,last=performance.now();
const cur={...poses.neutral,gaze:0,blink:0,open:0};
// Calm, continuous micro-expression: motion without random emotions.
let blinkBeat=0;
function feel(name,duration=2400){if(!poses[name]||mode!=='awake')return;emotion=name;emotionUntil=performance.now()+Math.max(300,Math.min(duration,6500))}
window.vincentFeel=feel;
// Dedicated emotion controller: owns interaction states and text-driven reactions.
const controller={chatOpen:false,typingUntil:0,replyUntil:0,replyMood:'curious',
 chat(opened){this.chatOpen=!!opened;this.typingUntil=0},
 typing(){this.typingUntil=performance.now()+900},
 message(text){const t=String(text).toLowerCase();this.replyMood=/haha|lustig|freu|toll|super|klasse|juhu/.test(t)?'happy':/traurig|schade|leid|sorry/.test(t)?'sad':/wow|oha|unglaublich/.test(t)?'surprised':/\?$/.test(t)?'curious':'playful';this.replyUntil=performance.now()+Math.min(6500,1700+t.length*38);feel(this.replyMood,Math.min(6500,1700+t.length*38));}
};
window.vincentController=controller;
window.vincentReactToText=(value)=>{const t=String(value||'').toLowerCase();let mood=null;
// Do not confuse words in an ordinary sentence with Vincent's own feelings.
if(/(?:das tut mir leid|entschuldige|schade|traurig|bedauerlich)/.test(t))mood='sad';
else if(/(?:oh je|ups|peinlich|verlegen)/.test(t))mood='shy';
else if(/(?:wow|unglaublich|oha|überraschung)/.test(t))mood='surprised';
else if(/(?:haha|hehe|hihi|kleiner scherz)/.test(t))mood='playful';
else if(/(?:freut mich|wunderbar|großartig|super gemacht|klasse gemacht)/.test(t))mood='happy';
// Short-lived expression tied to Vincent's actual reply, not idle randomness.
if(mood)feel(mood,2200);
else if(t.trim().endsWith('?'))feel('curious',1800);
};
const lerp=(a,b,k)=>a+(b-a)*k;
function eyeD(cx,cy,height){const h=Math.max(2,height)/2,w=30;return `M ${cx-w} ${cy} C ${cx-w} ${cy-h*1.3} ${cx+w} ${cy-h*1.3} ${cx+w} ${cy} C ${cx+w} ${cy+h*1.3} ${cx-w} ${cy+h*1.3} ${cx-w} ${cy} Z`}
function frame(now){requestAnimationFrame(frame);if(document.hidden){last=now;return}const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
const talking=host.classList.contains('talking')||host.classList.contains('audio-speaking');const thinking=host.classList.contains('thinking');const listening=host.classList.contains('listening');
let pose=mode==='sleep'?poses.sleepy:mode==='checking'?poses.checking:poses.neutral;if(mode==='awake'&&thinking)pose=poses.thinking;else if(mode==='awake'&&listening)pose=poses.listening;else if(mode==='awake'&&now<emotionUntil)pose=poses[emotion];else if(mode==='awake'&&controller.chatOpen){
 if(now<controller.replyUntil)pose=poses[controller.replyMood];
 else if(now<controller.typingUntil)pose=poses.curious;
 else if(now<chatUntil)pose=poses[chatPose==='reading'?'curious':chatPose==='peek'?'playful':chatPose==='speaking'?'happy':chatPose==='curious'?'curious':'playful'];
 else pose=poses.playful;
}
if(mode==='awake'&&talking&&speechStarted&&now-speechStarted<16000){const phase=Math.floor((now-speechStarted)/1450)%4;pose=poses[phase===0?speechMood:phase===1?'curious':phase===2?'happy':speechMood]||pose;}
if(mode==='awake'&&now>=nextBlink){blinkStart=now;blinkDuration=170+Math.random()*70;nextBlink=now+3600+Math.random()*3500}
const elapsed=now-blinkStart;const blink=mode==='sleep'?0:elapsed>=0&&elapsed<blinkDuration?Math.sin(Math.PI*elapsed/blinkDuration):0;
if(mode==='awake'&&now>=nextLook){look=(thinking||listening||talking)?0:(Math.random()<.45?0:(Math.random()-.5)*8);nextLook=now+3300+Math.random()*3600}
// No random emotions. Only calm eye micro-movements and conversation-driven expressions.
// Smooth exponential easing is frame-rate independent.
const k=1-Math.exp(-dt*5.2);for(const prop of ['eye','smile','brow','blush'])cur[prop]=lerp(cur[prop],pose[prop],k);
cur.gaze=lerp(cur.gaze,mode==='awake'?pose.gaze+look:0,1-Math.exp(-dt*1.7));cur.blink=lerp(cur.blink,blink,1-Math.exp(-dt*28));
let targetOpen=0;if(mode!=='sleep'&&talking){const raw=parseFloat(host.style.getPropertyValue('--audio-mouth-scale'));targetOpen=host.classList.contains('audio-speaking')&&Number.isFinite(raw)?Math.max(.1,Math.min(.95,(raw-.3)/1.8)):.10+.25*(.5+.5*Math.sin(now/190));}else if(now<emotionUntil&&emotion==='surprised')targetOpen=.38;
cur.open=lerp(cur.open,targetOpen,1-Math.exp(-dt*8));
const awake=mode==='awake';
// Slow breathing in eyes and eyebrows; subtle asymmetry, no new emotional poses.
const breath=awake?Math.sin(now/1050)*.045:0;const wakeT=Math.max(0,1-(now-wakeStart)/1550);const wakeBounce=wakeT?Math.sin((1-wakeT)*Math.PI*3)*wakeT:0;
const attention=awake&&!thinking&&!listening&&!talking?Math.sin(now/1150)*(controller.chatOpen?7.5:4):0;
const talkSmile=awake&&talking?Math.sin(now/320)*.11:0;
const eyeHeight=112*(cur.eye+breath)*(1-.97*cur.blink)*(wakeT?Math.max(.12,1-wakeT*.86):1);
if(mode==='sleep'){eyes[0].setAttribute('d',`M 216 292 Q 246 315 276 292`);eyes[1].setAttribute('d',`M 364 292 Q 394 315 424 292`);eyes.forEach(e=>{e.setAttribute('fill','none');e.setAttribute('stroke',glow);e.setAttribute('stroke-width','8');e.setAttribute('stroke-linecap','round')});}else{eyes.forEach(e=>{e.setAttribute('fill',glow);e.setAttribute('stroke','none')});eyes[0].setAttribute('d',eyeD(246+cur.gaze,285,eyeHeight));eyes[1].setAttribute('d',eyeD(394+cur.gaze,285,eyeHeight));}
// Head tilts and leans smoothly during chat without changing the robot design.
const chatTilt=awake&&controller.chatOpen?Math.sin(now/1600)*4:0;
const emotionTilt=awake&&now<emotionUntil?(emotion==='curious'?3:emotion==='shy'?-4:emotion==='surprised'?-2:0):0;
const tilt=chatTilt+emotionTilt;
const lean=awake&&controller.chatOpen?Math.sin(now/1150)*5:0;
const headGroup=svg.querySelector('#vincent-companion-face');
if(headGroup)headGroup.setAttribute('transform',`translate(0 ${lean.toFixed(2)}) rotate(${tilt.toFixed(2)} 320 315)`);
brows.forEach(e=>e.setAttribute('opacity',mode==='sleep'?'0':'.68'));
brows[0].setAttribute('d',`M 219 ${211+cur.brow+attention} Q 246 ${204+cur.brow+attention} 274 ${211+cur.brow+attention}`);brows[1].setAttribute('d',`M 366 ${211+cur.brow-attention*.6} Q 394 ${204+cur.brow-attention*.6} 421 ${211+cur.brow-attention*.6}`);
cheeks.forEach(e=>e.setAttribute('opacity',String(Math.max(0,cur.blush)*.38)));
const corner=390-11*(cur.smile+talkSmile+wakeBounce*.35),mid=390+14*(cur.smile+talkSmile+wakeBounce*.35),wide=48;
if(cur.open>.035){const depth=6+cur.open*36;mouth.setAttribute('d',`M ${320-wide} ${corner} Q 320 ${mid} ${320+wide} ${corner} Q 320 ${mid+depth} ${320-wide} ${corner} Z`);mouth.setAttribute('fill',glow)}else{mouth.setAttribute('d',`M ${320-wide} ${corner} Q 320 ${mid+4} ${320+wide} ${corner}`);mouth.setAttribute('fill','none')}
}
requestAnimationFrame(frame);
})();
