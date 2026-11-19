/* Standalone room. No access to Vincent's brain, audio, keyboard or memory. */
(()=>{'use strict';
const root=document.getElementById('room-root');if(!root)return;
const S={lights:true,curtains:true,weather:'clear'};
root.innerHTML=`<div class="room" id="vr-room" data-period="night" data-season="autumn">
 <div class="wall"></div><div class="wall-glow"></div><div class="wall-arch"></div><div class="ambient-led"></div>
 <div class="window" id="vr-window" role="button" tabindex="0" aria-label="Vorhang öffnen oder schließen"><div class="sky"><div class="sunmoon"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="distant-hills"></div><div class="city"></div><div class="city-lights"></div><div class="shoreline"></div><div class="lake"></div><div class="reflections"></div><div class="horizon"></div><div class="particles" id="vr-particles"></div></div><div class="window-frame"></div><div class="curtain left"></div><div class="curtain right"></div></div>
 <div class="ceiling-strip"></div><div class="floor"></div><div class="rug"></div><div class="plant"><i></i><i></i><i></i><i></i><i></i><b></b></div>
 <div class="shelf"><span class="books"></span><span class="pot"></span><span class="gloworb"></span></div><div class="room-art" aria-hidden="true"></div><div class="floor-cushion" aria-hidden="true"></div>
 <button class="lamp" id="vr-lamp" aria-label="Zimmerlicht umschalten"><span class="lampshade"></span><span class="lampstem"></span><span class="lampbase"></span></button>

 <button class="wardrobe" id="vr-wardrobe" aria-label="Kleiderschrank öffnen"><span class="wardrobe-door left-door"></span><span class="wardrobe-door right-door"></span><span class="wardrobe-knob"></span></button><section class="wardrobe-panel" id="vr-wardrobe-panel" hidden><strong>Vivis Kleiderschrank</strong><p>Wähle eine Beleuchtung für den Schrank:</p><button data-outfit="violet">Violett</button><button data-outfit="blue">Blau</button><button data-outfit="pink">Rosa</button><button id="vr-wardrobe-close">Schließen</button></section><button class="nightstand" aria-label="Nachttisch"><span></span></button><button class="alarm-clock" id="vr-alarm" aria-label="Wecker neben dem Bett"><span id="vr-alarm-time">--:--</span></button><button class="bed" id="vr-bed" aria-label="Bett auswählen"><span class="bed-head"></span><span class="pillow"></span><span class="blanket"></span><span class="bed-foot"></span></button>
 <div class="hud"><div class="eyebrow">VIVI · PRIVATE SUITE</div><div class="season-label" id="vr-season"></div></div>
 <div class="wall-calendar" aria-label="Heutiges Datum"><span class="wall-month" id="vr-month-letter">--</span><strong class="wall-day" id="vr-day">--</strong></div>
 <div class="toast" id="vr-toast" role="status" aria-live="polite"></div>
 <div class="figure-slot" id="vr-figure-slot" aria-label="Freier Platz für Vivis getrennte Figur"></div>
 </div>`;
const $=id=>root.querySelector('#'+id),room=$('vr-room'),fmt=(d,o)=>new Intl.DateTimeFormat('de-DE',o).format(d);
let dateKey='',timer,toastTimer;
function notify(t){$('vr-toast').textContent=t;$('vr-toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('vr-toast').classList.remove('visible'),2300)}
function season(m){return m===11||m<=1?'winter':m<=4?'spring':m<=7?'summer':'autumn'}
function update(){const d=new Date(),h=d.getHours(),m=d.getMonth(),key=`${d.getFullYear()}-${m}-${d.getDate()}`;room.dataset.period=h<6||h>=21?'night':h<11?'morning':h<17?'day':'evening';room.dataset.season=season(m);$('vr-alarm-time').textContent=fmt(d,{hour:'2-digit',minute:'2-digit'});$('vr-season').textContent=({winter:'❄ Winter',spring:'✿ Frühling',summer:'☀ Sommer',autumn:'❖ Herbst'})[season(m)];$('vr-day').textContent=d.getDate();$('vr-month-letter').textContent=fmt(d,{month:'short'}).replace('.','').toUpperCase();if(dateKey!==key){dateKey=key;makeParticles()}}
function makeParticles(){const p=$('vr-particles');p.replaceChildren();const type=room.dataset.season;for(let i=0;i<18;i++){const el=document.createElement('i');el.className='particle';el.style.setProperty('--x',((i*47+13)%100)+'%');el.style.setProperty('--delay',(-i*.73)+'s');el.style.setProperty('--dur',(8+i%6)+'s');el.style.setProperty('--size',(2+i%4*2)+'px');p.append(el)}p.dataset.type=type}
$('vr-lamp').onclick=()=>{S.lights=!S.lights;room.classList.toggle('lights-off',!S.lights);notify(S.lights?'Zimmerlicht eingeschaltet':'Zimmerlicht ausgeschaltet')};
function curtains(){S.curtains=!S.curtains;room.classList.toggle('curtains-closed',!S.curtains);notify(S.curtains?'Vorhänge geöffnet':'Vorhänge geschlossen')}
$('vr-window').onclick=curtains;$('vr-window').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();curtains()}};
$('vr-alarm').onclick=()=>notify('Wecker · '+$('vr-alarm-time').textContent);
$('vr-wardrobe').onclick=()=>{$('vr-wardrobe-panel').hidden=!$('vr-wardrobe-panel').hidden;room.classList.toggle('wardrobe-open',!$('vr-wardrobe-panel').hidden)};
$('vr-wardrobe-close').onclick=()=>{$('vr-wardrobe-panel').hidden=true;room.classList.remove('wardrobe-open')};
root.querySelectorAll('[data-outfit]').forEach(btn=>btn.onclick=()=>{room.dataset.wardrobeColor=btn.dataset.outfit;notify('Schrankbeleuchtung: '+btn.textContent)});
$('vr-bed').onclick=()=>notify('Bett ausgewählt · Platz für spätere Vincent-Interaktion');
update();makeParticles();timer=setInterval(update,15000);
window.VincentRoom={mountFigure(node){if(node instanceof HTMLElement)$('vr-figure-slot').append(node)},getState(){return {period:room.dataset.period,season:room.dataset.season,lights:S.lights,curtainsOpen:S.curtains}},destroy(){clearInterval(timer);clearTimeout(toastTimer);root.replaceChildren();delete window.VincentRoom}};
})();
