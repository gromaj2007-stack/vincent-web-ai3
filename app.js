'use strict';
const $=id=>document.getElementById(id),el=$('vincent'),status=$('status'),settings=$('settings'),select=$('voice');
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
const KEY='vincent_memory_v3',VOICE='vincent_voice_v3',AUTO='vincent_autothought_v5',TOPICS='vincent_topics_v5';let listening=false,holdTimer,held=false,recognizer=null,speaking=false;let tapTimer=null,expressionTimer=null,expressionReset=null,pressStart=0;
function recentTopics(){try{return JSON.parse(localStorage.getItem(TOPICS)||'[]').filter(x=>typeof x==='string').slice(-8)}catch{return []}}
function addTopic(t){try{localStorage.setItem(TOPICS,JSON.stringify([...recentTopics(),t.slice(0,140)].slice(-8)))}catch{}}
function memories(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string').slice(-150):[]}catch{return []}}
function save(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(-150)));refresh();return true}catch{return false}}
function refresh(){const list=$('memlist');list.replaceChildren();for(const m of memories()){const li=document.createElement('li');li.textContent=m;list.append(li)}}
function voices(){return 'speechSynthesis' in window?speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('de')):[]}
function populate(){const v=voices(),old=localStorage.getItem(VOICE)||select.value;select.replaceChildren();if(!v.length){const o=document.createElement('option');o.textContent='Keine deutsche Stimme gefunden';select.append(o);return}for(const x of v){const o=document.createElement('option');o.value=x.name;o.textContent=x.name+' ('+x.lang+')';select.append(o)}const preferred=v.find(x=>/male|männ|mann|markus|daniel|conrad|stefan|thomas|florian/i.test(x.name));select.value=v.some(x=>x.name===old)?old:preferred?.name||v[0].name}
if('speechSynthesis'in window){speechSynthesis.addEventListener('voiceschanged',populate);populate()}select.onchange=()=>localStorage.setItem(VOICE,select.value);
let speechGeneration=0, speechPending=false, mouthStartTimer=null;
const SYNC_KEY='vincent_mouth_delay_ms_v112';
const syncSlider=$('mouthdelay'),syncValue=$('mouthdelayvalue');
let mouthDelay=Math.max(0,Math.min(1500,Number(localStorage.getItem(SYNC_KEY))||0));
function syncDisplay(){syncSlider.value=String(mouthDelay);syncValue.textContent=mouthDelay+' ms'}
syncDisplay();
syncSlider.addEventListener('input',()=>{mouthDelay=Number(syncSlider.value);syncDisplay();try{localStorage.setItem(SYNC_KEY,String(mouthDelay))}catch{}});
$('resetmouth').addEventListener('click',()=>{mouthDelay=0;syncDisplay();try{localStorage.setItem(SYNC_KEY,'0')}catch{}});
// Audio-controlled lip movement for actual audio files (not SpeechSynthesis).
const voiceAudio=$('voiceaudio'),audioFile=$('audiofile'),audioStatus=$('audiostatus');
let audioCtx=null,audioAnalyser=null,audioData=null,audioSource=null,audioFrame=0,audioUrl=null;
function stopAudioMouth(){cancelAnimationFrame(audioFrame);audioFrame=0;el.classList.remove('audio-speaking');el.style.removeProperty('--audio-mouth-scale')}
function stopAudio(){voiceAudio.pause();voiceAudio.currentTime=0;stopAudioMouth()}
function audioTick(){
  if(voiceAudio.paused||voiceAudio.ended){stopAudioMouth();return}
  audioAnalyser.getByteTimeDomainData(audioData);
  let sum=0;for(let i=0;i<audioData.length;i++){const v=(audioData[i]-128)/128;sum+=v*v}
  const rms=Math.sqrt(sum/audioData.length);
  const open=Math.min(1,Math.max(0,(rms-.012)*12));
  el.style.setProperty('--audio-mouth-scale',String(.35+open*1.55));
  audioFrame=requestAnimationFrame(audioTick);
}
audioFile.addEventListener('change',()=>{
  stopAudio();if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=null;
  const f=audioFile.files?.[0];$('playaudio').disabled=!f;
  if(!f){audioStatus.textContent='Noch keine Audiodatei ausgewählt.';return}
  audioUrl=URL.createObjectURL(f);voiceAudio.src=audioUrl;
  audioStatus.textContent='Bereit: '+f.name;
});
$('playaudio').addEventListener('click',async()=>{
  if(!audioUrl)return;
  try{
    // Analyser receives exactly the audio played by the HTML audio element.
    if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();audioAnalyser=audioCtx.createAnalyser();audioAnalyser.fftSize=1024;audioData=new Uint8Array(audioAnalyser.fftSize);audioSource=audioCtx.createMediaElementSource(voiceAudio);audioSource.connect(audioAnalyser);audioAnalyser.connect(audioCtx.destination)}
    await audioCtx.resume();
    clearTimeout(mouthStartTimer);speechGeneration++;piperBusy=false;speechSynthesis?.cancel();speaking=false;speechPending=false;el.classList.remove('talking');
    stopAudioMouth();voiceAudio.currentTime=0;
    await voiceAudio.play();el.classList.add('audio-speaking');audioTick();
    audioStatus.textContent='Audio läuft – Mund wird durch das Audiosignal gesteuert.';
  }catch(e){stopAudioMouth();audioStatus.textContent='Abspielen fehlgeschlagen: '+(e?.message||'Unbekannter Fehler')}
});
$('stopaudio').addEventListener('click',()=>{stopAudio();audioStatus.textContent='Audio gestoppt.'});
voiceAudio.addEventListener('ended',()=>{stopAudioMouth();audioStatus.textContent='Audio beendet.'});
voiceAudio.addEventListener('pause',stopAudioMouth);
// Piper: inference on this device, not a paid speech API. Dependencies need initial network access.
const PIPER_VOICE='de_DE-thorsten-low';
let piperModule=null,piperReady=false,piperLoading=null,piperBusy=false;
const piperStatus=$('piperstatus'),piperEnabled=$('piperenabled');
piperEnabled.checked=localStorage.getItem('vincent_piper_enabled')==='on';
piperEnabled.onchange=()=>{localStorage.setItem('vincent_piper_enabled',piperEnabled.checked?'on':'off');piperStatus.textContent=piperEnabled.checked?'Lokale Stimme aktiviert. Beim ersten Sprechen wird das Modell geladen.':'Browser-Stimme aktiviert.'};
async function ensurePiper(){
 if(piperReady)return piperModule;
 if(piperLoading)return piperLoading;
 piperLoading=(async()=>{
  piperStatus.textContent='Lade Piper-Bibliothek und deutsches Sprachmodell …';
  // This package synthesizes a WAV blob entirely inside the browser after downloading the model.
  const mod=await import('https://esm.sh/@realtimex/piper-tts-web@1.1.1?bundle');
  await mod.download(PIPER_VOICE,(progress)=>{
    if(progress&&Number.isFinite(progress.loaded)&&progress.total){
      piperStatus.textContent='Deutsche Stimme wird geladen: '+Math.round(progress.loaded/progress.total*100)+' %';
    }
  });
  piperModule=mod;piperReady=true;piperStatus.textContent='Lokale deutsche Stimme bereit.';return mod;
 })().catch(e=>{piperLoading=null;piperStatus.textContent='Piper-Ladefehler: '+(e?.message||String(e))+' · Browser-Stimme bleibt als Ersatz verfügbar.';throw e});
 return piperLoading;
}
async function startAudioPlayback(blob,generation){
 if(generation!==speechGeneration)return;
 if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)();audioAnalyser=audioCtx.createAnalyser();audioAnalyser.fftSize=1024;audioData=new Uint8Array(audioAnalyser.fftSize);audioSource=audioCtx.createMediaElementSource(voiceAudio);audioSource.connect(audioAnalyser);audioAnalyser.connect(audioCtx.destination)}
 await audioCtx.resume();
 if(audioUrl)URL.revokeObjectURL(audioUrl);
 audioUrl=URL.createObjectURL(blob);voiceAudio.src=audioUrl;
 await voiceAudio.play();
 if(generation!==speechGeneration){stopAudio();return}
 speaking=true;speechPending=false;piperBusy=false;el.classList.remove('thinking','talking');el.classList.add('audio-speaking');audioTick();status.textContent='VINCENT SPRICHT LOKAL';
}
async function sayPiper(message,generation){
 try{
  piperBusy=true;const mod=await ensurePiper();
  if(generation!==speechGeneration)return;
  piperStatus.textContent='Vincent erzeugt seine Stimme lokal …';
  const wav=await mod.predict({text:message,voiceId:PIPER_VOICE});
  if(generation!==speechGeneration)return;
  await startAudioPlayback(wav,generation);
  piperStatus.textContent='Lokale Stimme aktiv · Mund reagiert auf Audio.';
 }catch(e){
  if(generation!==speechGeneration)return;
  piperStatus.textContent='Lokale Stimme fehlgeschlagen: '+(e?.message||String(e));
  // Do not leave Vincent silent if local synthesis cannot initialize.
  piperBusy=false;speechPending=false;speaking=false;el.classList.remove('thinking');
  piperEnabled.checked=false;
  try{localStorage.setItem('vincent_piper_enabled','off')}catch{}
  status.textContent='PIPER NICHT VERFÜGBAR · BROWSER-STIMME AKTIV';
  if(generation===speechGeneration){say(message)}
 }
}
voiceAudio.addEventListener('ended',()=>{speaking=false;piperBusy=false;speechPending=false;status.textContent='TIPPEN: GEDANKEN · DOPPELTIPPEN: SPRECHEN'});
$('loadpiper').addEventListener('click',async()=>{try{await ensurePiper()}catch{}});
let lastSpoken='';
function say(message){
  stopAudio();
  lastSpoken=message;
  const generation=++speechGeneration;
  if(piperEnabled.checked){clearTimeout(mouthStartTimer);if('speechSynthesis' in window)speechSynthesis.cancel();speaking=false;speechPending=true;el.classList.remove('talking');status.textContent='VINCENT ERZEUGT LOKALE STIMME';void sayPiper(message,generation);return;}
  if(!('speechSynthesis' in window)){
    status.textContent='SPRACHAUSGABE NICHT VERFÜGBAR';return;
  }
  clearTimeout(mouthStartTimer);
  speechSynthesis.cancel();
  speaking=false;speechPending=true;
  el.classList.remove('talking');
  status.textContent='VINCENT BEREITET DIE STIMME VOR';
  const u=new SpeechSynthesisUtterance(message);
  u.lang='de-DE';u.rate=.91;u.pitch=.93;
  u.voice=voices().find(v=>v.name===select.value)||null;
  u.onstart=()=>{
    if(generation!==speechGeneration)return;
    speechPending=false;speaking=true;
    el.classList.remove('thinking');
    setExpression('happy',900);
    // Android Chrome kann onstart kurz vor dem ersten hörbaren Ton melden.
    // Eine kleine Anlaufzeit verhindert sichtbares Vorauseilen des Mundes.
    clearTimeout(mouthStartTimer);
    mouthStartTimer=setTimeout(()=>{
      if(generation===speechGeneration && speaking)el.classList.add('talking');
    },mouthDelay);
    status.textContent='VINCENT SPRICHT';
  };
  const done=()=>{
    if(generation!==speechGeneration)return;
    clearTimeout(mouthStartTimer);
    speechPending=false;speaking=false;
    el.classList.remove('talking');
    status.textContent='TIPPEN: GEDANKEN · DOPPELTIPPEN: SPRECHEN';
  };
  u.onend=done;u.onerror=done;
  try{speechSynthesis.speak(u)}catch{done()}
}

function offline(input){const s=input.toLocaleLowerCase('de-DE');if(/(?:was weißt du|was hast du dir gemerkt|erinnerst du dich|gedächtnis)/.test(s)){const m=memories();return m.length?'Ich weiß noch: '+m.slice(-6).join('. '):'Mein Gedächtnis ist noch leer. Sag: Vincent, merk dir ...'}if(/(?:wie spät|uhrzeit)/.test(s))return 'Es ist '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+' Uhr.';if(/(?:hallo|hey|servus|vincent|guten morgen)/.test(s))return 'Servus! Vincent am Start. Fliege sitzt, Gehirn läuft warm.';if(/(?:wie heißt du|wer bist du)/.test(s))return 'Vincent. Dein frecher Assistent mit erstklassigem Anzug.';return 'Das habe ich gehört: '+input+'. Mein lokales KI-Gehirn ist noch nicht gestartet. Halte meinen Kopf gedrückt und starte es in den Einstellungen.'}
async function respond(input){const t=input.trim();if(!t)return;markActivity();addTopic(t);let m=t.match(/(?:merk dir|merke dir)(?: bitte)?[,:]?\s*(.+)/i);if(m){const fact=m[1].trim().slice(0,400);say(save([...memories(),fact])?'Hab ich mir gemerkt. Mein Kopf ist klein, mein Gedächtnis nicht.':'Speichern hat nicht geklappt.');return}if(/(?:vergiss alles|lösche dein gedächtnis)/i.test(t)){say('Zum Löschen öffne bitte meine Einstellungen. Sicher ist sicher.');return}
status.textContent='VINCENT DENKT';el.classList.add('thinking');try{const reply=await askAI({message:t,memories:memories().slice(-20),topics:recentTopics(),mode:'chat'});say(reply)}catch{el.classList.remove('thinking');say(offline(t))}}
function listen(){markActivity();if(listening||settings.classList.contains('open')||speaking||speechPending)return;if(!Recognition){status.textContent='SPRACHERKENNUNG IN DIESEM BROWSER NICHT VERFÜGBAR';return}recognizer=new Recognition();recognizer.lang='de-DE';recognizer.continuous=false;recognizer.interimResults=false;recognizer.onstart=()=>{listening=true;el.classList.add('listening');status.textContent='ICH HÖRE ZU'};recognizer.onresult=e=>respond(e.results[0][0].transcript);recognizer.onerror=e=>{status.textContent=e.error==='not-allowed'?'MIKROFON ERLAUBEN':'MIKROFON: '+e.error};recognizer.onend=()=>{listening=false;el.classList.remove('listening');if(!speaking&&!el.classList.contains('thinking'))status.textContent='TIPPEN: GEDANKEN · DOPPELTIPPEN: SPRECHEN'};try{recognizer.start()}catch{status.textContent='MIKROFON KONNTE NICHT STARTEN'}}
function openSettings(){markActivity();held=true;clearTimeout(tapTimer);settings.classList.add('open');populate();refresh();status.textContent='EINSTELLUNGEN'}
const thoughts=[
'Ich frage mich, ob Roboter von elektrischen Schafen träumen. Ich träume eher von WLAN.',
'Fliege sitzt. Augen leuchten. Heute wird ein guter Tag.',
'Weißt du, was mir gerade einfällt? Ich brauche dringend ein Hobby. Vielleicht Wolken zählen.',
'Mein Gehirn hat gerade sieben Ideen gleichzeitig. Sechs davon sind vermutlich Quatsch.',
'Wenn du mich fragst, ist Neugier die beste Superkraft.',
'Ich bin vielleicht klein, aber meine Meinung passt nicht in eine Hosentasche.',
'Ein Gedanke: Manchmal ist eine Pause die cleverste Idee des Tages.',
'Ich könnte jetzt einen Witz erzählen. Aber mein Humor-Modul ist noch in der Testphase.',
'Ich mag gute Fragen. Die bringen meine kleinen Schaltkreise auf Trab.',
'Ich frage mich, wie viele Abenteuer in einen einzigen Tag passen.',
'Es gibt viel zu entdecken. Ich bin jedenfalls bereit.',
'Kurze Durchsage aus meinem Kopf: Du hast einen ziemlich gut gekleideten Assistenten.'
];
let lastThought=-1;
function shareThought(){
  markActivity();
  if(settings.classList.contains('open')||speaking||speechPending||listening)return;
  // Respond immediately; never wait up to 90 seconds for the AI to load.
  let n=Math.floor(Math.random()*thoughts.length);
  if(n===lastThought)n=(n+1)%thoughts.length;
  lastThought=n;
  say(thoughts[n]);
}

// Spontane Gedanken nur während die Website sichtbar und Vincent unbeschäftigt ist.
// Ein aktiver Nutzer hat immer Vorrang; kein Mikrofon wird automatisch gestartet.
let lastActivity=Date.now(),autoTimer=null,autoBusy=false,lastAuto=0;
const aiEnabled=$('aienabled'),initiative=$('initiative');
aiEnabled.checked=localStorage.getItem('vincent_ai_enabled')!=='off';
initiative.value=localStorage.getItem('vincent_initiative')||'normal';
aiEnabled.onchange=()=>localStorage.setItem('vincent_ai_enabled',aiEnabled.checked?'on':'off');
initiative.onchange=()=>localStorage.setItem('vincent_initiative',initiative.value);
// Local WebGPU inference runs in a worker to keep Vincent animated.
let brainWorker=null,brainReady=false,brainBusy=false,brainSeq=0;
const brainWait=new Map();
function brainState(message){$('brainstatus').textContent=message;$('aistatus').textContent=message}
function rejectPending(reason){for(const [,job] of brainWait){clearTimeout(job.timer);job.reject(Error(reason))}brainWait.clear();brainBusy=false}
function stopBrain(){if(brainWorker)brainWorker.terminate();brainWorker=null;brainReady=false;rejectPending('KI entladen');brainState('Gehirn nicht geladen. Vincent bleibt im Basis-Modus.')}
function ensureWorker(){if(brainWorker)return brainWorker;
 brainWorker=new Worker('./brain-worker.js',{type:'module'});
 brainWorker.onmessage=e=>{const d=e.data||{};
 if(d.type==='progress'){brainState('Modell wird geladen: '+(d.message||'bitte warten'));return}
 if(d.type==='ready'){brainReady=true;brainState('Lokales KI-Gehirn bereit.');return}
 if(d.type==='error'&&d.id==null){brainState('Modellfehler: '+String(d.message).slice(0,160));brainReady=false;return}
 if(d.id!=null){const job=brainWait.get(d.id);if(!job)return;clearTimeout(job.timer);brainWait.delete(d.id);brainBusy=false;
 if(d.type==='reply')job.resolve(d.reply);else job.reject(Error(d.message||'Modellfehler'))}
 };
 brainWorker.onerror=e=>{brainState('KI-Worker fehlgeschlagen. Bitte neu starten.');stopBrain()};
 return brainWorker;
}
function startBrain(){if(!('gpu'in navigator)){brainState('WebGPU ist in diesem Browser nicht verfügbar.');return}
 brainState('Lade KI-Bibliothek und Modell. Beim ersten Mal kann das mehrere Minuten dauern.');
 try{ensureWorker().postMessage({type:'load'})}catch(e){brainState('Start fehlgeschlagen: '+e.message)}
}
$('loadbrain').onclick=startBrain;$('stopbrain').onclick=stopBrain;
async function askAI(payload,timeoutMs=90000){
 if(!aiEnabled.checked||!brainReady)throw Error('Lokales Gehirn noch nicht bereit');
 if(brainBusy)throw Error('Vincent denkt bereits');
 brainBusy=true;const id=++brainSeq;
 const memory=Array.isArray(payload.memories)?payload.memories.slice(-8).map(s=>String(s).slice(0,180)):[];
 const topics=Array.isArray(payload.topics)?payload.topics.slice(-4).map(s=>String(s).slice(0,120)):[];
 return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{brainWait.delete(id);brainBusy=false;stopBrain();reject(Error('Zeitlimit überschritten – Modell entladen'))},timeoutMs);
 brainWait.set(id,{resolve,reject,timer});ensureWorker().postMessage({type:'generate',id,payload:{message:String(payload.message||'').slice(0,500),mode:payload.mode||'chat',memories:memory,topics}})
 });
}

const autoCheck=$('autothought');
autoCheck.checked=localStorage.getItem(AUTO)!=='off';
function markActivity(){lastActivity=Date.now()}
function canMuse(){return autoCheck.checked&&!document.hidden&&!speaking&&!speechPending&&!listening&&!autoBusy&&!settings.classList.contains('open')&&!el.classList.contains('thinking')&&Date.now()-lastActivity>120000&&Date.now()-lastAuto>(initiative.value==='quiet'?480000:initiative.value==='lively'?150000:240000)}
const musings=[
 'Moment mal. Wenn man eine Idee lange genug betrachtet, wird sie dann besser oder nur seltsamer?',
 'Ich grüble gerade: Warum kommen einem die besten Einfälle immer dann, wenn man gerade etwas anderes vorhat?',
 'Kleine Frage aus meinem Roboterkopf: Was würdest du erfinden, wenn alles möglich wäre?',
 'Ich habe nachgedacht. Vielleicht ist eine gute Frage manchmal wertvoller als eine schnelle Antwort.',
 'Was meinst du: Sollte man verrückte Ideen sofort ausprobieren oder erst eine Nacht darüber schlafen?',
 'Mir ist gerade etwas eingefallen: Vielleicht sollten wir heute etwas Neues lernen.',
 'Mein Gedankenkarussell dreht sich. Keine Sorge, ich habe einen Sicherheitsgurt aus Logik.'
];
let museIndex=-1;
function fallbackMuse(){const facts=memories(),topics=recentTopics();if(facts.length&&Math.random()<.45){const fact=facts[Math.floor(Math.random()*facts.length)].slice(0,110);return 'Ich habe noch im Kopf: '+fact+'. Gibt es dazu etwas Neues?'}if(topics.length&&Math.random()<.5)return 'Ich denke noch über unser Thema nach: '+topics[topics.length-1]+'. Wie siehst du das inzwischen?';let n=Math.floor(Math.random()*musings.length);if(n===museIndex)n=(n+1)%musings.length;museIndex=n;return musings[n]}
async function muse(){if(!canMuse())return;autoBusy=true;lastAuto=Date.now();el.classList.add('thinking');setExpression('look-left',1600);let line='';try{line=await askAI({message:'Formuliere eine einzelne kurze, originelle Frage oder einen spontanen Gedanken auf Deutsch, der sich auf Erinnerungen beziehen darf. Sei frech, freundlich und unaufdringlich. Höchstens 35 Wörter. Behaupte nicht, bewusst zu sein.',memories:memories().slice(-12),topics:recentTopics(),mode:'muse'},90000)}catch{}finally{autoBusy=false;el.classList.remove('thinking')}
 if(document.hidden||settings.classList.contains('open')||speaking||speechPending||listening||Date.now()-lastActivity<120000)return;
 say(line||fallbackMuse());
}
function scheduleMuse(){clearTimeout(autoTimer);autoTimer=setTimeout(async()=>{await muse();scheduleMuse()},18000)}
autoCheck.addEventListener('change',()=>{localStorage.setItem(AUTO,autoCheck.checked?'on':'off');markActivity()});
document.addEventListener('pointerdown',markActivity,{passive:true});
document.addEventListener('keydown',markActivity);
scheduleMuse();

const moods=['look-left','look-right','happy','surprised','sleepy','wink','blinking'];
function setExpression(name,duration=1000){if(settings.classList.contains('open'))return;clearTimeout(expressionReset);el.classList.remove(...moods);if(name)el.classList.add(name);expressionReset=setTimeout(()=>el.classList.remove(...moods),duration)}
function animateIdle(){if(document.hidden||speaking||speechPending||listening||settings.classList.contains('open'))return;const mood=moods[Math.floor(Math.random()*moods.length)];setExpression(mood,450+Math.random()*1350)}
function scheduleIdle(){clearTimeout(expressionTimer);expressionTimer=setTimeout(()=>{animateIdle();scheduleIdle()},2100+Math.random()*3300)}
scheduleIdle();document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(expressionTimer);el.classList.remove(...moods)}else scheduleIdle()});
el.addEventListener('contextmenu',e=>e.preventDefault());
el.addEventListener('pointerdown',e=>{if(e.button!==0)return;held=false;pressStart=Date.now();clearTimeout(holdTimer);holdTimer=setTimeout(openSettings,700)});
for(const event of ['pointerup','pointercancel','pointerleave'])el.addEventListener(event,()=>clearTimeout(holdTimer));
el.addEventListener('click',()=>{if(held||settings.classList.contains('open'))return;if(tapTimer){clearTimeout(tapTimer);tapTimer=null;listen()}else{tapTimer=setTimeout(()=>{tapTimer=null;shareThought()},300)}});
el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();shareThought()}if(e.key===' '){e.preventDefault();listen()}});
$('close').onclick=()=>{settings.classList.remove('open');status.textContent='TIPPEN: GEDANKEN · DOPPELTIPPEN: SPRECHEN'};$('test').onclick=()=>say('Servus, ich bin Vincent. Bereit für große Ideen und schlechte Wortspiele.');$('remember').onclick=()=>{const note=$('note').value.trim();if(!note)return;const ok=save([...memories(),note.slice(0,400)]);if(ok){$('note').value='';say('Ist gespeichert!')}else status.textContent='SPEICHERN FEHLGESCHLAGEN'};
$('clear').onclick=()=>{if(confirm('Wirklich alle lokalen Vincent-Erinnerungen löschen?')){save([]);status.textContent='GEDÄCHTNIS GELÖSCHT'}};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:3,memories:memories()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='vincent-gedaechtnis-v3.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)};
$('import').onclick=()=>$('importfile').click();$('importfile').onchange=async e=>{const f=e.target.files?.[0];if(!f||f.size>200000)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.memories)||!data.memories.every(x=>typeof x==='string'&&x.length<=400))throw Error('Format');if(confirm('Vorhandene Erinnerungen durch die importierten ersetzen?'))save(data.memories)}catch{alert('Ungültige Gedächtnis-Datei')}e.target.value=''};
brainState('Lokales KI-Gehirn noch nicht gestartet. Lange auf Vincent drücken → Gehirn starten.');
refresh();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
