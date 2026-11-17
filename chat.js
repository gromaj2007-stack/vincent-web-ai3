/* Vincent Alive chat: physical keyboard is not opened because no input is focused. */
(()=>{'use strict';
const main=document.querySelector('main'),figure=document.getElementById('vincent'),panel=document.getElementById('vincent-chat'),toggle=document.getElementById('chat-toggle'),log=document.getElementById('chat-log'),draft=document.getElementById('chat-draft'),send=document.getElementById('chat-send'),keys=document.getElementById('chat-keys');
if(!main||!figure||!panel)return;
let value='',shift=false,numbers=false,readTimer=0,peekTimer=0;
const active=()=>!panel.hidden;
function drawDraft(){draft.textContent=value||'Schreib Vivi etwas …';draft.classList.toggle('empty',!value)}
function pose(name,ms=1100){if(!active())return;window.vincentChatPose?.(name,ms);figure.classList.toggle('chat-read',name==='reading');clearTimeout(readTimer);if(name==='reading')readTimer=setTimeout(()=>figure.classList.remove('chat-read'),ms)}
function open(opened){panel.hidden=!opened;main.classList.toggle('chat-open',opened);toggle.setAttribute('aria-expanded',String(opened));toggle.textContent=opened?'✕ Chat':'⌨ Chat';toggle.setAttribute('aria-label',opened?'Chat schließen':'Chat öffnen');window.vincentChatOpen=opened;window.vincentChatPose?.(opened?'peek':'neutral',1400);window.vincentController?.chat(opened);if(opened){figure.classList.remove('chat-peek');void figure.offsetWidth;figure.classList.add('chat-peek');clearTimeout(peekTimer);peekTimer=setTimeout(()=>figure.classList.remove('chat-peek'),1100);log.scrollTop=log.scrollHeight}}
toggle.addEventListener('click',()=>open(!active()));
function addMessage(who,message){const s=String(message||'').trim();if(!s)return;const item=document.createElement('div');item.className='chat-message '+(who==='user'?'user':'vincent');item.textContent=s;log.append(item);while(log.children.length>65)log.firstElementChild.remove();log.scrollTop=log.scrollHeight;if(who==='vincent'){pose('speaking',Math.min(4000,900+s.length*28));window.vincentController?.message(s)}}
window.vincentChatMessage=addMessage;
// Persistent key nodes: no expensive keyboard re-render after every character.
let caps=false,repeatTimer=0,repeatDelay=0;
const keyButtons=[];
const alternates={a:['ä','á','à','â','ã','å'],o:['ö','ó','ò','ô','õ'],u:['ü','ú','ù','û'],s:['ß','ś','š'],e:['é','è','ê','ë'],i:['í','ì','î','ï'],c:['ç','ć'],n:['ñ'],y:['ý','ÿ'],z:['ž'],1:['¹','½','¼'],2:['²'],3:['³','¾'],0:['°'],'.':['…',',','!','?'],',':[';','!','?']};
const topNumbers=['1','2','3','4','5','6','7','8','9','0'];
let activePicker=null;
function vibrate(n=6){try{navigator.vibrate?.(n)}catch{}}
function redrawLabels(){for(const [node,letter] of keyButtons){const label=node.querySelector('.chat-key-label');if(label)label.textContent=shift?letter.toUpperCase():letter.toLowerCase()}}
function applyKey(output){
 if(output==='BACK')value=Array.from(value).slice(0,-1).join('');
 else if(output==='SHIFT'){shift=!shift;redrawLabels()}
 else if(output==='NUM'){numbers=!numbers;requestAnimationFrame(renderKeys)}
 else if(output==='SEND'){sendMessage();return}
 else {value+=output==='SPACE'?' ':shift?output.toUpperCase():output.toLowerCase();if(shift){shift=false;redrawLabels()}}
 drawDraft();if(output!=='SHIFT'&&output!=='NUM')window.vincentController?.typing();
}
function pickerClose(commit=true){if(!activePicker)return;const x=activePicker;activePicker=null;x.node.remove();if(commit)applyKey(x.options[x.selected]);}
function pickerShow(button,output){
 const opts=[output,...(alternates[output.toLowerCase()]||[])];if(!numbers&&/^[qwertzuiopasdfghjklyxcvbnm]$/i.test(output)){const idx='qwertzuiop'.indexOf(output.toLowerCase());if(idx>=0)opts.push(topNumbers[idx]);}
 if(opts.length<2)return false;
 const node=document.createElement('div');node.className='vincent-key-options';node.setAttribute('role','group');node.setAttribute('aria-label','Sonderzeichen auswählen');
 opts.forEach((v,i)=>{const cell=document.createElement('span');cell.className='vincent-option'+(i===0?' selected':'');cell.textContent=shift?v.toUpperCase():v;node.append(cell)});
 document.body.append(node);
 const rect=button.getBoundingClientRect();const w=Math.min(innerWidth-12,Math.max(112,opts.length*34));
 node.style.width=w+'px';node.style.left=Math.max(6,Math.min(innerWidth-w-6,rect.left+rect.width/2-w/2))+'px';node.style.top=Math.max(5,rect.top-node.offsetHeight-7)+'px';
 activePicker={node,options:opts,selected:0};return true;
}
function pickerMove(clientX){if(!activePicker)return;const p=activePicker;const r=p.node.getBoundingClientRect();const idx=Math.max(0,Math.min(p.options.length-1,Math.floor((clientX-r.left)/r.width*p.options.length)));if(idx!==p.selected){p.selected=idx;vibrate(3);[...p.node.children].forEach((e,i)=>e.classList.toggle('selected',i===idx))}}
function key(label,output,extra='',hint=''){
 const b=document.createElement('button');b.type='button';b.className='chat-key '+extra;b.setAttribute('aria-label',label);
 const text=document.createElement('span');text.className='chat-key-label';text.textContent=label;b.append(text);
 if(hint){const small=document.createElement('span');small.className='chat-key-hint';small.textContent=hint;b.append(small)}
 if(output.length===1&&/[a-z]/i.test(output))keyButtons.push([b,output]);
 let longTimer=0,wasLong=false,down=false,ignoreClick=false;
 b.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();down=true;wasLong=false;ignoreClick=true;b.classList.add('pressed');vibrate();
  try{b.setPointerCapture(e.pointerId)}catch{}
  clearTimeout(longTimer);
  if(output==='BACK'){applyKey(output);repeatDelay=setTimeout(()=>{repeatTimer=setInterval(()=>applyKey('BACK'),65)},390)}
  else if(output==='SPACE'||output==='SEND'||output==='SHIFT'||output==='NUM')applyKey(output);
  else longTimer=setTimeout(()=>{wasLong=pickerShow(b,output);if(wasLong)vibrate(12)},320);
 });
 b.addEventListener('pointermove',e=>{if(down&&activePicker)pickerMove(e.clientX)});
 b.addEventListener('pointerup',e=>{if(!down)return;down=false;clearTimeout(longTimer);clearTimeout(repeatDelay);clearInterval(repeatTimer);b.classList.remove('pressed');if(activePicker)pickerClose(true);else if(!wasLong&&output!=='BACK'&&!['SPACE','SEND','SHIFT','NUM'].includes(output))applyKey(output);});
 b.addEventListener('pointercancel',()=>{down=false;clearTimeout(longTimer);clearTimeout(repeatDelay);clearInterval(repeatTimer);b.classList.remove('pressed');pickerClose(false)});
 b.addEventListener('click',e=>{if(ignoreClick){ignoreClick=false;return}applyKey(output)});
 return b;
}
function renderKeys(){
 keyButtons.length=0;keys.replaceChildren();
 const rows=numbers?['1234567890','@#€%&-+()/','*"\':;!?.,']:['qwertzuiop','asdfghjkl','yxcvbnm'];
 const fragment=document.createDocumentFragment();
 if(numbers){const toolbar=document.createElement('div');toolbar.className='vincent-symbol-toolbar';for(const ch of ['€','@','#','&','%','+','-','/','?','!'])toolbar.append(key(ch,ch,'symbol'));fragment.append(toolbar);}
 rows.forEach((letters,i)=>{const row=document.createElement('div');row.className='chat-key-row';if(i===2&&!numbers)row.append(key('⇧','SHIFT','action'));[...letters].forEach((letter,j)=>{const lower=letter.toLowerCase();const hint=!numbers&&i===0?topNumbers[j]:alternates[lower]?.[0]||'';row.append(key(shift?letter.toUpperCase():letter.toLowerCase(),letter,'',hint))});if(i===2)row.append(key('⌫','BACK','action'));fragment.append(row)});
 const last=document.createElement('div');last.className='chat-key-row';last.append(key(numbers?'ABC':'123','NUM','action'),key(', ',','),key('Leerzeichen','SPACE','wide'),key('.','.'),key('↵','SEND','action'));fragment.append(last);keys.append(fragment);
}
function sendMessage(){const text=value.trim();if(!text)return;value='';drawDraft();addMessage('user',text);pose('curious',1600);if(typeof window.vincentChatSubmit==='function')window.vincentChatSubmit(text);else {addMessage('vincent','Vivi startet noch. Bitte gleich erneut versuchen.');window.dispatchEvent(new CustomEvent('vincent-chat-submit',{detail:{message:text}}));}}
send.addEventListener('click',sendMessage);renderKeys();drawDraft();
})();
