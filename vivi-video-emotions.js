/* Vivi 5.0: optional video-like GIF animation layer. Does not touch AI or TTS. */
(()=>{'use strict';
const find=()=>document.getElementById('vincent');
let figure=null, image=null, art=null, emotion='neutral', timer=0, speaking=false;
const rules=[['happy',/(?:freu|super|toll|lustig|haha|glück|danke|schön|cool|witz|klasse|wunderbar|yay)/i],['thinking',/(?:denk|warum|wie |frage|überleg|vielleicht|hmm|grübel|prüf|analys|warte|moment)/i],['surprised',/(?:wow|unglaublich|wirklich|ernsthaft|überrasch|oha|krass)/i]];
function detect(text){return rules.find(([,re])=>re.test(String(text||'')))?.[0]||'neutral'}
function setEmotion(next,ttl=0){emotion=['happy','thinking','surprised','speaking','neutral'].includes(next)?next:'neutral';if(figure)figure.dataset.viviVideoEmotion=emotion;if(timer)clearTimeout(timer);if(ttl)timer=setTimeout(()=>setEmotion(speaking?'speaking':'neutral'),ttl);}
function init(){figure=find();if(!figure||figure.dataset.viviVideoReady)return false;
 art=document.getElementById('vivi-classic-art');
 if(!art)return false;
 figure.dataset.viviVideoReady='1';
 const css=document.createElement('style');css.textContent=`
 #vincent[data-vivi-video-ready="1"]{position:relative;isolation:isolate;overflow:hidden}
 #vincent[data-vivi-video-ready="1"] #vivi-classic-art{opacity:0!important;pointer-events:none!important}
 #vivi-video-art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 48%;pointer-events:none;z-index:2;transform-origin:50% 68%;animation:viviVidIdle 4s ease-in-out infinite;transition:filter .55s ease}
 #vincent[data-vivi-video-emotion="happy"] #vivi-video-art{animation:viviVidHappy 3.3s ease-in-out infinite;filter:brightness(1.08) saturate(1.12)}
 #vincent[data-vivi-video-emotion="thinking"] #vivi-video-art{animation:viviVidThink 5s ease-in-out infinite;filter:brightness(.92) saturate(.94)}
 #vincent[data-vivi-video-emotion="surprised"] #vivi-video-art{animation:viviVidSurprise 1.8s ease-in-out infinite;filter:brightness(1.12)}
 #vincent[data-vivi-video-emotion="speaking"] #vivi-video-art{animation:viviVidSpeak .7s ease-in-out infinite}
 @keyframes viviVidIdle{0%,100%{transform:translateY(0) scale(1.01)}50%{transform:translateY(2px) scale(1.018)}}
 @keyframes viviVidHappy{0%,100%{transform:translateY(0) scale(1.015)}50%{transform:translateY(-3px) rotate(.3deg) scale(1.026)}}
 @keyframes viviVidThink{0%,100%{transform:translateX(0) scale(1.018)}50%{transform:translateX(2px) rotate(-.4deg) scale(1.018)}}
 @keyframes viviVidSurprise{0%,100%{transform:scale(1.02)}50%{transform:scale(1.04)}}
 @keyframes viviVidSpeak{0%,100%{transform:translateY(0) scale(1.01)}50%{transform:translateY(-1px) scale(1.017)}}
 @media(prefers-reduced-motion:reduce){#vivi-video-art{animation:none!important;transition:none!important}}
 `;document.head.appendChild(css);
 image=document.createElement('img');image.id='vivi-video-art';image.src='./vivi-original.gif?v=500';image.alt='Vivi – animiertes Original';image.decoding='async';
 image.onerror=()=>{figure.dataset.viviVideoReady='';if(art)art.style.removeProperty('opacity');image.remove();};
 figure.appendChild(image);setEmotion('neutral');
 const watch=new MutationObserver(()=>{if(!figure?.isConnected)return;const now=figure.classList.contains('talking')||figure.classList.contains('audio-speaking');if(now!==speaking){speaking=now;setEmotion(now?'speaking':'neutral');}else if(!now&&figure.classList.contains('thinking')&&emotion!=='thinking'){setEmotion('thinking');}});
 watch.observe(figure,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)setEmotion('neutral')});
 return true;
}
window.ViviVideoAnimation={setEmotion,detect,react(text){setEmotion(detect(text),5000)}};
window.addEventListener('vincent-chat-submit',e=>window.ViviVideoAnimation.react(e.detail?.message));
window.addEventListener('vivi-speech-boundary',()=>{if(speaking)setEmotion('speaking')});
let tries=0;const boot=()=>{if(init())return;if(++tries<40)setTimeout(boot,300)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
