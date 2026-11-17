(()=>{function init(){const settings=document.getElementById('settings');if(!settings)return;
// Remove old voice configuration widgets; preserve the test button and all other settings.
for(const id of ['voicestyle','voice','onlinevoice','piperenabled','loadpiper','piperstatus','onlinevoicestatus','mouthdelay','mouthdelayvalue','resetmouth','audiofile','playaudio','stopaudio','audiostatus']){
 const el=document.getElementById(id);if(!el)continue;
 if(el.closest('label'))el.closest('label').style.display='none';
 else el.style.display='none';
}
const head=[...settings.querySelectorAll('h2')];for(const h of head){if(/Neue Online-Stimme|Lokale deutsche KI-Stimme|Audio-Synchronisation|Vivis Stimme/.test(h.textContent))h.style.display='none';}
const badge=document.getElementById('vincent-build');if(badge)badge.textContent='Vivi 4.0 · Textgesteuerte Mimik';
const note=document.createElement('p');note.textContent='Stimme: weibliche deutsche Chrome-Stimme, sofern verfügbar. Hans wird nicht verwendet.';
settings.insertBefore(note,settings.querySelector('#test')?.parentElement||settings.firstChild);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();