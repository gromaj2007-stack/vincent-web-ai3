/* Vincent Alive chat: physical keyboard is not opened because no input is focused. */
(()=>{'use strict';
const main=document.querySelector('main'),figure=document.getElementById('vincent'),panel=document.getElementById('vincent-chat'),toggle=document.getElementById('chat-toggle'),log=document.getElementById('chat-log'),draft=document.getElementById('chat-draft'),send=document.getElementById('chat-send'),keys=document.getElementById('chat-keys');
if(!main||!figure||!panel)return;
let value='',shift=false,numbers=false,readTimer=0,peekTimer=0;
const active=()=>!panel.hidden;
function drawDraft(){draft.textContent=value||'Schreib Vincent etwas …';draft.classList.toggle('empty',!value)}
function pose(name,ms=1100){if(!active())return;window.vincentChatPose?.(name,ms);figure.classList.toggle('chat-read',name==='reading');clearTimeout(readTimer);if(name==='reading')readTimer=setTimeout(()=>figure.classList.remove('chat-read'),ms)}
function open(opened){panel.hidden=!opened;main.classList.toggle('chat-open',opened);toggle.setAttribute('aria-expanded',String(opened));toggle.textContent=opened?'✕ Chat':'⌨ Chat';toggle.setAttribute('aria-label',opened?'Chat schließen':'Chat öffnen');window.vincentChatOpen=opened;window.vincentChatPose?.(opened?'peek':'neutral',1400);if(opened){figure.classList.remove('chat-peek');void figure.offsetWidth;figure.classList.add('chat-peek');clearTimeout(peekTimer);peekTimer=setTimeout(()=>figure.classList.remove('chat-peek'),1100);log.scrollTop=log.scrollHeight}}
toggle.addEventListener('click',()=>open(!active()));
function addMessage(who,message){const s=String(message||'').trim();if(!s)return;const item=document.createElement('div');item.className='chat-message '+(who==='user'?'user':'vincent');item.textContent=s;log.append(item);while(log.children.length>65)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;if(who==='vincent')pose('speaking',Math.min(4000,900+s.length*28));}
window.vincentChatMessage=addMessage;
// Persistent key nodes: no expensive keyboard re-render after every character.
let caps=false,repeatTimer=0,repeatDelay=0,popupTimer=0;
const keyButtons=[];
function vibrate(){try{if(navigator.vibrate)navigator.vibrate(8)}catch{}}
function preview(button,label){
  if(!label||label.length!==1)return;
  const bubble=document.createElement('span');bubble.className='chat-key-popup';bubble.textContent=label;
  button.append(bubble);clearTimeout(popupTimer);popupTimer=setTimeout(()=>bubble.remove(),190);
}
function applyKey(output,button){
  if(output==='BACK')value=value.slice(0,-1);
  else if(output==='SHIFT'){shift=!shift;caps=shift;}
  else if(output==='NUM'){numbers=!numbers;renderKeys();}
  else if(output==='SEND'){sendMessage();return;}
  else value+=output==='SPACE'?' ':shift?output.toUpperCase():output.toLowerCase();
  if(output!=='SHIFT'&&output!=='BACK'&&output!=='NUM')shift=false;
  drawDraft();
  // Update labels only when shift changes, not the entire DOM.
  if(output==='SHIFT'||(caps&&!shift)){caps=shift;for(const [node,letter] of keyButtons)node.textContent=shift?letter.toUpperCase():letter.toLowerCase();}
  pose('reading',850);
}
function key(label,output,extra=''){
  const b=document.createElement('button');b.type='button';b.className='chat-key '+extra;b.textContent=label;b.setAttribute('aria-label',label);
  b.style.touchAction='none';
  if(output.length===1&&/[a-z]/i.test(output))keyButtons.push([b,output]);
  let handled=false;
  b.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();handled=true;b.classList.add('pressed');
    try{b.setPointerCapture(e.pointerId)}catch{}
    vibrate();preview(b,label);applyKey(output,b);
    if(output==='BACK'){
      clearTimeout(repeatDelay);clearInterval(repeatTimer);
      repeatDelay=setTimeout(()=>{repeatTimer=setInterval(()=>applyKey('BACK',b),65)},400);
    }
  });
  const release=()=>{b.classList.remove('pressed');clearTimeout(repeatDelay);clearInterval(repeatTimer);};
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  // Keyboard/switch accessibility and browsers without PointerEvent.
  b.addEventListener('click',()=>{if(handled){handled=false;return;}applyKey(output,b)});
  return b;
}
function renderKeys(){
  keyButtons.length=0;keys.replaceChildren();
  const rows=numbers?['1234567890','@#€%&-+()/',"*\"':;!?.,"]:['QWERTZUIOP','ASDFGHJKL','YXCVBNM'];
  const fragment=document.createDocumentFragment();
  for(let i=0;i<rows.length;i++){
    const row=document.createElement('div');row.className='chat-key-row';
    if(i===2&&!numbers)row.append(key('⇧','SHIFT','action'));
    for(const letter of [...rows[i]])row.append(key(shift?letter.toUpperCase():letter.toLowerCase(),letter));
    if(i===2)row.append(key('⌫','BACK','action'));
    fragment.append(row);
  }
  const last=document.createElement('div');last.className='chat-key-row';
  last.append(key(numbers?'ABC':'123','NUM','action'),key(', ',','),key('Leerzeichen','SPACE','wide'),key('.','.'),key('↵','SEND','action'));
  fragment.append(last);keys.append(fragment);
}
function sendMessage(){const text=value.trim();if(!text)return;value='';drawDraft();addMessage('user',text);pose('curious',1600);if(typeof window.vincentChatSubmit==='function')window.vincentChatSubmit(text);else {addMessage('vincent','Vincent startet noch. Bitte gleich erneut versuchen.');window.dispatchEvent(new CustomEvent('vincent-chat-submit',{detail:{message:text}}));}}
send.addEventListener('click',sendMessage);renderKeys();drawDraft();
})();
