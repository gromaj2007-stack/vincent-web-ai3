(()=>{function init(){const settings=document.getElementById('settings');if(!settings)return;
const hide=['voicestyle','voice','onlinevoice','mouthdelay','mouthdelayvalue','resetmouth'];
for(const id of hide){const e=document.getElementById(id);if(e)(e.closest('label')||e).style.display='none'}
const piper=document.getElementById('piperenabled');if(piper){piper.checked=true;(piper.closest('label')||piper).style.display='none'}
const info=document.createElement('p');info.textContent='Stimme: lokale deutsche Piper-Stimme Kerstin (weiblich). Kostenlos. Beim ersten Test werden Bibliothek und Modell heruntergeladen. Bei Fehler: „Piper laden“ erneut drücken. Kein Hans-Fallback.';
settings.insertBefore(info,settings.querySelector('#test')?.parentElement||settings.firstChild);
const badge=document.getElementById('vincent-build');if(badge)badge.textContent='Vivi 4.4 · Lokale weibliche Stimme';
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();
