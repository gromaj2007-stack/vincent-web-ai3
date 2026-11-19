/* Standalone room. No access to Vincent's brain, audio, keyboard or memory. */
(()=>{'use strict';
const root=document.getElementById('room-root');if(!root)return;
const S={lights:true,curtains:true,weather:'clear'};
root.innerHTML=`<div class="room" id="vr-room" data-period="night" data-season="autumn">
 <div class="wall"></div><div class="wall-glow"></div><div class="wall-arch"></div><div class="ambient-led"></div>
 <div class="window" id="vr-window" role="button" tabindex="0" aria-label="Vorhang öffnen oder schließen"><div class="sky"><div class="sunmoon"></div><div class="stars"></div><div class="sun-glow"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="distant-hills"></div><div class="city"></div><div class="city-lights"></div><div class="neon-buildings"></div><div class="shoreline"></div><div class="beach"></div><div class="lake"></div><div class="sun-path"></div><div class="waves wave-a"></div><div class="waves wave-b"></div><div class="reflections"></div><div class="palm palm-left"><i></i><b></b></div><div class="palm palm-right"><i></i><b></b></div><div class="birds"></div><div class="yacht"><i></i></div><div class="horizon"></div></div><div class="window-frame"></div><div class="curtain left"></div><div class="curtain right"></div></div>
 <div class="ceiling-strip"></div><div class="ceiling-ring ring-one"></div><div class="floor"></div><div class="rug"></div><div class="plant"><i></i><i></i><i></i><i></i><i></i><b></b></div>
 <div class="shelf"><span class="books"></span><span class="pot"></span><span class="gloworb"></span></div>
 <button class="lamp" id="vr-lamp" aria-label="Zimmerlicht umschalten"><span class="lampshade"></span><span class="lampstem"></span><span class="lampbase"></span></button>

 <button class="wardrobe" id="vr-wardrobe" aria-label="Kleiderschrank öffnen"><span class="wardrobe-door left-door"></span><span class="wardrobe-door right-door"></span><span class="wardrobe-knob"></span></button><section class="wardrobe-panel" id="vr-wardrobe-panel" hidden><strong>Vivis Kleiderschrank</strong><p>Dein Kleiderschrank</p><button id="vr-wardrobe-close">Schließen</button></section><button class="nightstand" aria-label="Nachttisch"><span></span></button><button class="alarm-clock" id="vr-alarm" aria-label="Wecker neben dem Bett"><span id="vr-alarm-time">--:--</span></button><button class="bed" id="vr-bed" aria-label="Bett auswählen"><span class="bed-head"></span><span class="pillow"></span><span class="blanket"></span><span class="heart-pillow">♡</span><span class="bed-foot"></span></button>
 <div class="hud"><div class="eyebrow">VIVI · PRIVATE SUITE</div><div class="season-label" id="vr-season"></div></div>
 <div class="wall-calendar" aria-label="Heutiges Datum"><span class="wall-month" id="vr-month-letter">--</span><strong class="wall-day" id="vr-day">--</strong></div>
<div class="toast" id="vr-toast" role="status" aria-live="polite"></div>
 <div class="figure-slot" id="vr-figure-slot" aria-label="Bewegungsebene für Vivis Figur"></div><div class="foreground-depth" aria-hidden="true"></div>
 </div>`;
const $=id=>root.querySelector('#'+id),room=$('vr-room'),fmt=(d,o)=>new Intl.DateTimeFormat('de-DE',o).format(d);
let dateKey='',timer,toastTimer;
function notify(t){$('vr-toast').textContent=t;$('vr-toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('vr-toast').classList.remove('visible'),2300)}
function season(m){return m===11||m<=1?'winter':m<=4?'spring':m<=7?'summer':'autumn'}

// Approximate solar events for Munich, Germany (48.1372 N, 11.5756 E).
// NOAA sunrise equation, including atmospheric refraction; no geolocation permission.
const SOLAR_LAT=48.1372,SOLAR_LON=11.5756;
function solarEvents(date){
 const rad=Math.PI/180,day=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate());
 const jd=day/86400000+2440587.5,n=Math.round(jd-2451545.0009+SOLAR_LON/360);
 const Jstar=2451545.0009-SOLAR_LON/360+n,M=(357.5291+.98560028*(Jstar-2451545))*rad;
 const C=1.9148*Math.sin(M)+.0200*Math.sin(2*M)+.0003*Math.sin(3*M);
 const lambda=((M/rad)+C+180+102.9372)*rad;
 const transit=Jstar+.0053*Math.sin(M)-.0069*Math.sin(2*lambda);
 const delta=Math.asin(Math.sin(lambda)*Math.sin(23.44*rad));
 const cosH=(Math.sin(-.833*rad)-Math.sin(SOLAR_LAT*rad)*Math.sin(delta))/(Math.cos(SOLAR_LAT*rad)*Math.cos(delta));
 const H=Math.acos(Math.max(-1,Math.min(1,cosH)))/rad;
 return {rise:new Date((transit-H/360-2440587.5)*86400000),set:new Date((transit+H/360-2440587.5)*86400000)};
}
function solarAppearance(date){
 const {rise,set}=solarEvents(date),now=date.getTime(),r=rise.getTime(),s=set.getTime(),twilight=35*60000;
 let phase='night',progress=0;
 if(now>=r-twilight&&now<r+twilight)phase='morning';
 else if(now>=r+twilight&&now<s-twilight)phase='day';
 else if(now>=s-twilight&&now<s+twilight)phase='evening';
 if(now>=r&&now<=s)progress=(now-r)/(s-r);
 return {phase,progress,daylight:now>=r&&now<=s};
}

function update(){const d=new Date(),m=d.getMonth(),key=`${d.getFullYear()}-${m}-${d.getDate()}`;const sun=solarAppearance(d);room.dataset.period=sun.phase;room.dataset.daylight=String(sun.daylight);room.style.setProperty('--sun-x',(8+sun.progress*75).toFixed(2)+'%');room.style.setProperty('--sun-y',(58-34*Math.sin(Math.PI*sun.progress)).toFixed(2)+'%');room.dataset.season=season(m);$('vr-alarm-time').textContent=fmt(d,{hour:'2-digit',minute:'2-digit'});$('vr-season').textContent=({winter:'❄ Winter',spring:'✿ Frühling',summer:'☀ Sommer',autumn:'❖ Herbst'})[season(m)];$('vr-day').textContent=d.getDate();$('vr-month-letter').textContent=fmt(d,{month:'short'}).replace('.','').toUpperCase();if(dateKey!==key){dateKey=key}}
$('vr-lamp').onclick=()=>{S.lights=!S.lights;room.classList.toggle('lights-off',!S.lights);notify(S.lights?'Zimmerlicht eingeschaltet':'Zimmerlicht ausgeschaltet')};
function curtains(){S.curtains=!S.curtains;room.classList.toggle('curtains-closed',!S.curtains);notify(S.curtains?'Vorhänge geöffnet':'Vorhänge geschlossen')}
$('vr-window').onclick=curtains;$('vr-window').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();curtains()}};
$('vr-alarm').onclick=()=>notify('Wecker · '+$('vr-alarm-time').textContent);
$('vr-wardrobe').onclick=()=>{$('vr-wardrobe-panel').hidden=!$('vr-wardrobe-panel').hidden;room.classList.toggle('wardrobe-open',!$('vr-wardrobe-panel').hidden)};
$('vr-wardrobe-close').onclick=()=>{$('vr-wardrobe-panel').hidden=true;room.classList.remove('wardrobe-open')};
$('vr-bed').onclick=()=>notify('Bett ausgewählt · Platz für spätere Vincent-Interaktion');
update();timer=setInterval(update,30000);
const figureSlot=$('vr-figure-slot');let figureNode=null;function placeFigure(x=50,depth=.5){const px=Math.max(12,Math.min(88,Number(x)||50)),z=Math.max(0,Math.min(1,Number(depth)||0));figureSlot.style.left=px+'%';figureSlot.style.bottom=(7+z*13)+'%';figureSlot.style.transform='translateX(-50%) scale('+(1.1-z*.36)+')';figureSlot.dataset.depth=z<.45?'front':'back'}
placeFigure();
window.VincentRoom={mountFigure(node){if(!(node instanceof HTMLElement))return false;figureSlot.replaceChildren(node);figureNode=node;placeFigure();return true},moveFigure(x,depth){if(!figureNode)return false;placeFigure(x,depth);return true},getState(){return {period:room.dataset.period,season:room.dataset.season,lights:S.lights,curtainsOpen:S.curtains}},destroy(){clearInterval(timer);clearTimeout(toastTimer);root.replaceChildren();delete window.VincentRoom}};
})();
