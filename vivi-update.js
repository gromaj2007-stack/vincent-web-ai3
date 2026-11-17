/* Vivi 2.4.0: check deployed version on launch/return, refresh only on version change. */
(()=>{'use strict';
const current='2.4.0', key='vivi-last-auto-refresh';
let busy=false;
async function check(){
 if(busy||!navigator.onLine||document.hidden)return;
 busy=true;
 try{
  const url=new URL('./version.json',location.href);
  url.searchParams.set('_',Date.now().toString());
  const res=await fetch(url,{cache:'no-store',headers:{'Cache-Control':'no-cache'}});
  if(!res.ok)return;
  const data=await res.json();
  if(!/^\d+\.\d+\.\d+$/.test(data.version||''))return;
  const newer=(a,b)=>{const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++){if(x[i]!==y[i])return x[i]>y[i]}return false};
  if(newer(data.version,current)){
   const last=Number(sessionStorage.getItem(key)||0);
   if(Date.now()-last<15000)return;
   sessionStorage.setItem(key,String(Date.now()));
   try{const reg=await navigator.serviceWorker?.getRegistration();await reg?.update()}catch(_){}
   location.reload();
  }
 }catch(_){/* offline or delayed deployment: keep existing app usable */}
 finally{busy=false}
}
window.addEventListener('pageshow',check);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
window.addEventListener('focus',check);
})();
