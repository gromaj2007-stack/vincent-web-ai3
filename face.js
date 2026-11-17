/* Vincent Expressions v2 — visible vector facial acting; no camera, no extra permissions. */
(()=>{'use strict';
const host=document.getElementById('vincent'),svg=host?.querySelector('svg');if(!svg)return;
const NS='http://www.w3.org/2000/svg',mk=(tag,attrs,parent=svg)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.appendChild(n);return n};
const original=svg.querySelectorAll('.eye');original.forEach(n=>n.style.opacity='0');const oldMouth=svg.querySelector('#mouth');if(oldMouth)oldMouth.style.opacity='0';
const g=mk('g',{id:'expressive-face'}),glow='#62eaff';
const left=mk('path',{fill:glow,filter:'url(#expressionGlow)'},g),right=mk('path',{fill:glow,filter:'url(#expressionGlow)'},g);
const browL=mk('path',{fill:'none',stroke:glow,'stroke-width':'7','stroke-linecap':'round',opacity:'.8'},g),browR=mk('path',{fill:'none',stroke:glow,'stroke-width':'7','stroke-linecap':'round',opacity:'.8'},g);
const cheekL=mk('ellipse',{cx:'196',cy:'365',rx:'17',ry:'8',fill:'#ff7aa8',opacity:'0'},g),cheekR=mk('ellipse',{cx:'444',cy:'365',rx:'17',ry:'8',fill:'#ff7aa8',opacity:'0'},g);
const mouth=mk('path',{fill:glow,stroke:glow,'stroke-width':'4','stroke-linecap':'round','stroke-linejoin':'round'},g);
const defs=svg.querySelector('defs');const filter=mk('filter',{id:'expressionGlow',x:'-70%',y:'-70%',width:'240%',height:'240%'},defs);mk('feGaussianBlur',{stdDeviation:'2.2',result:'b'},filter);const merge=mk('feMerge',{},filter);mk('feMergeNode',{in:'b'},merge);mk('feMergeNode',{in:'SourceGraphic'},merge);
const poses={
neutral:{eyes:[1,1],brows:[0,0],smile:.2,open:0},
happy:{eyes:[.72,.72],brows:[-4,-4],smile:1,open:.13},
delighted:{eyes:[.58,.58],brows:[-8,-8],smile:1.25,open:.4},
shy:{eyes:[.67,.67],brows:[6,6],smile:.5,open:0,blush:1,gaze:-8},
hurt:{eyes:[.82,.8],brows:[-13,13],smile:-.75,open:0},
sad:{eyes:[.65,.65],brows:[-9,9],smile:-.9,open:0,gaze:-8},
surprised:{eyes:[1.23,1.23],brows:[-14,-14],smile:0,open:1},
curious:{eyes:[1.04,.85],brows:[-12,7],smile:.2,open:.1,gaze:9},
skeptical:{eyes:[.62,1],brows:[12,-7],smile:-.2,open:0},
playful:{eyes:[.12,.92],brows:[3,-5],smile:.8,open:.12},
thinking:{eyes:[.86,.86],brows:[-5,5],smile:0,open:0,gaze:11},
listening:{eyes:[1.1,1.1],brows:[-8,-8],smile:.2,open:0},
sleepy:{eyes:[.4,.4],brows:[8,8],smile:.1,open:0}
};
let mood='neutral',until=0,last=performance.now(),blink=0,nextBlink=performance.now()+2100,turn=0,smoothedOpen=0;
const rand=(a,b)=>a+Math.random()*(b-a);
function setMood(m,duration=1800){if(!poses[m])m='neutral';mood=m;until=performance.now()+duration;}
window.vincentFeel=(m,d=2300)=>setMood(m,d);
window.vincentReactToText=text=>{const t=String(text||'').toLowerCase();let m='happy';if(/(?:tut mir leid|traurig|verletzt|schmerz|schade|entschuldig|leid tun)/.test(t))m='hurt';else if(/(?:verlegen|peinlich|rot werden|schüchtern|oh je)/.test(t))m='shy';else if(/(?:wow|unglaublich|ernsthaft|was\?|wirklich\?|überrasch)/.test(t))m='surprised';else if(/(?:haha|hehe|witz|spaß|frech|grins)/.test(t))m='playful';else if(/(?:freu|super|klasse|großartig|wunderbar)/.test(t))m='delighted';setMood(m,Math.min(6500,2600+t.length*14));};
function eyePath(cx,cy,w,h,curve=0){const rx=w/2,ry=Math.max(3,h/2);return `M ${cx-rx} ${cy} C ${cx-rx} ${cy-ry*1.25+curve} ${cx+rx} ${cy-ry*1.25-curve} ${cx+rx} ${cy} C ${cx+rx} ${cy+ry*1.25-curve} ${cx-rx} ${cy+ry*1.25+curve} ${cx-rx} ${cy} Z`}
function frame(now){if(document.hidden){requestAnimationFrame(frame);return}const dt=Math.min(.07,(now-last)/1000);last=now;
if(now>nextBlink){blink=1;nextBlink=now+rand(2500,6500)}blink=Math.max(0,blink-dt*6);
const talking=host.classList.contains('talking')||host.classList.contains('audio-speaking');const thinking=host.classList.contains('thinking');const listening=host.classList.contains('listening');
let p=poses[mood];if(now>until&&!talking){if(thinking)p=poses.thinking;else if(listening)p=poses.listening;else p=poses.neutral;}
const b=Math.max(0,1-Math.abs(blink-.82)*5),gaze=(p.gaze||0)+Math.sin(now/1400)*2.8;
const bob=Math.sin(now/480)*1.1;
left.setAttribute('d',eyePath(246+gaze,285+bob,61,112*p.eyes[0]*(1-.94*b),p.brows[0]*.14));
right.setAttribute('d',eyePath(394+gaze,285+bob,61,112*p.eyes[1]*(1-.94*b),p.brows[1]*.14));
browL.setAttribute('d',`M 214 ${207+p.brows[0]} Q 244 ${200+p.brows[0]*1.25} 278 ${208-p.brows[0]*.25}`);
browR.setAttribute('d',`M 362 ${208-p.brows[1]*.25} Q 394 ${200+p.brows[1]*1.25} 426 ${207+p.brows[1]}`);
cheekL.setAttribute('opacity',String((p.blush||0)*(.33+.09*Math.sin(now/400))));cheekR.setAttribute('opacity',cheekL.getAttribute('opacity'));
let open=p.open;if(talking){const raw=host.classList.contains('audio-speaking')?Number.parseFloat(host.style.getPropertyValue('--audio-mouth-scale')):NaN;open=Number.isFinite(raw)?Math.min(1.1,Math.max(.15,(raw-.3)/1.5)):.28+.46*(.5+.5*Math.sin(now/95))}smoothedOpen+=(open-smoothedOpen)*Math.min(1,dt*16);
const y=390,cornerY=y-17*p.smile,midY=y+18*p.smile,wide=49+(p.smile>0?5*p.smile:0);
if(smoothedOpen>.055){const depth=5+smoothedOpen*43;mouth.setAttribute('d',`M ${320-wide} ${cornerY} Q 320 ${midY} ${320+wide} ${cornerY} Q 320 ${midY+depth} ${320-wide} ${cornerY} Z`);mouth.setAttribute('fill',glow)}else{mouth.setAttribute('d',`M ${320-wide} ${cornerY} Q 320 ${midY+5} ${320+wide} ${cornerY}`);mouth.setAttribute('fill','none')}
requestAnimationFrame(frame)}
requestAnimationFrame(frame);
let idleTimer;function idle(){if(document.hidden)return;const pool=['neutral','happy','curious','skeptical','shy','playful','sleepy'];if(performance.now()>until&&!host.classList.contains('thinking')&&!host.classList.contains('listening')&&!host.classList.contains('talking')&&!host.classList.contains('audio-speaking'))setMood(pool[Math.floor(Math.random()*pool.length)],rand(1200,2700));idleTimer=setTimeout(idle,rand(3200,5600))}idle();
})();
