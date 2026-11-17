/* Vivi 5.1: single video body, no competing animation systems. */
(()=>{'use strict';
function init(){
 const figure=document.getElementById('vincent');
 const video=document.getElementById('vivi-video-body');
 if(!figure||!video)return;
 const badge=document.getElementById('vincent-build');
 if(badge)badge.textContent='Vivi 5.1 · Ein Videokörper';
 video.addEventListener('error',()=>{const s=document.getElementById('status');if(s)s.textContent='Videokörper konnte nicht geladen werden. Datei vivi-original.gif prüfen.';});
 // The single GIF is an animation source, not a lip-synced emotion library.
 window.viviVideoBody={setEmotion(name){figure.dataset.viviEmotion=String(name||'neutral')}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();