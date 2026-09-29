import { LOCATIONS, locationFromUrl } from "./locations.js";
import { observerFor, sampleNight, moonInfo, solarEvents, sampleObjects } from "./astronomy.js";
import { drawClock } from "./clock.js";

const params=new URLSearchParams(location.search);let locationData=locationFromUrl(params),observer=observerFor(locationData);
const app=document.querySelector("#app");if(params.get("embed")==="1")app.classList.add("embed");
let selected=params.get("date")||localDateString(new Date(),locationData.timeZone);
const trackVisibility={moon:params.get("moon")!=="0",planets:params.get("planets")==="1",deepSky:params.get("deepSky")==="1"};let soloObject=params.get("object")||null;

function parts(date,tz){return Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]))}
function offsetMs(date,tz){const p=parts(date,tz),asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);return asUtc-date.getTime()+date.getMilliseconds()}
function zonedDate(y,m,d,h,tz){let guess=new Date(Date.UTC(y,m-1,d,h));for(let i=0;i<3;i++)guess=new Date(Date.UTC(y,m-1,d,h)-offsetMs(guess,tz));return guess}
function localDateString(date,tz){const p=parts(date,tz);return `${p.year}-${p.month}-${p.day}`}
function noonFor(dateStr){const[y,m,d]=dateStr.split("-").map(Number);return zonedDate(y,m,d,12,locationData.timeZone)}
function nextDateString(dateStr){const[y,m,d]=dateStr.split("-").map(Number),x=new Date(Date.UTC(y,m-1,d+1));return x.toISOString().slice(0,10)}
function intervalFor(dateStr){return {start:noonFor(dateStr),end:noonFor(nextDateString(dateStr))}}
function formatTime(d){return new Intl.DateTimeFormat("en-US",{timeZone:locationData.timeZone,hour:"numeric",minute:"2-digit"}).format(d)}
function zoneLabel(d){const parts=new Intl.DateTimeFormat("en-US",{timeZone:locationData.timeZone,timeZoneName:"short"}).formatToParts(d);return parts.find(p=>p.type==="timeZoneName")?.value||locationData.timeZone}
function wallClockMinutes(d){const p=parts(d,locationData.timeZone);let h=+p.hour;if(h===24)h=0;const mins=h*60+(+p.minute)+(+p.second)/60;return (mins-720+1440)%1440}
function formatDate(dateStr){const[y,m,d]=dateStr.split("-").map(Number);return new Intl.DateTimeFormat("en-US",{dateStyle:"full",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,d)))}
function addDays(n){const[y,m,d]=selected.split("-").map(Number),x=new Date(Date.UTC(y,m-1,d+n));selected=x.toISOString().slice(0,10);render()}
function phaseName(angle){const a=((angle%360)+360)%360;if(a<22.5||a>=337.5)return"New Moon";if(a<67.5)return"Waxing crescent";if(a<112.5)return"First quarter";if(a<157.5)return"Waxing gibbous";if(a<202.5)return"Full Moon";if(a<247.5)return"Waning gibbous";if(a<292.5)return"Last quarter";return"Waning crescent"}
function moonGlyph(angle){const a=((angle%360)+360)%360;return a<22.5||a>=337.5?"●":a<67.5?"◔":a<112.5?"◐":a<157.5?"◕":a<202.5?"○":a<247.5?"◕":a<292.5?"◑":"◔"}
function eventRows(start){return solarEvents(start,observer)}
function moonNightDetails(samples,rows){
 const crossings=[];for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if((a.moonAlt<0&&b.moonAlt>=0)||(a.moonAlt>=0&&b.moonAlt<0)){const f=(0-a.moonAlt)/(b.moonAlt-a.moonAlt),date=new Date(a.date.getTime()+f*(b.date-a.date));crossings.push({type:b.moonAlt>=0?"rise":"set",date})}}
 const peak=samples.reduce((best,x)=>x.moonAlt>best.moonAlt?x:best,samples[0]),rise=crossings.find(x=>x.type==="rise")?.date,set=crossings.find(x=>x.type==="set")?.date;
 const eve=rows.find(x=>x.label==="Evening Astronomical twilight")?.date,morn=rows.find(x=>x.label==="Morning Astronomical twilight")?.date;
 let observing="";if(eve&&morn){const dark=samples.filter(x=>x.date>=eve&&x.date<=morn),down=dark.filter(x=>x.moonAlt<0);if(!down.length)observing="Moon above horizon throughout astronomical night";else if(down.length===dark.length)observing="Moon below horizon throughout astronomical night";else{let longest=null,begin=null,prev=null;for(const x of dark){if(x.moonAlt<0){if(!begin)begin=x.date;prev=x.date}else if(begin){if(!longest||prev-begin>longest[1]-longest[0])longest=[begin,prev];begin=prev=null}}if(begin&&(!longest||prev-begin>longest[1]-longest[0]))longest=[begin,prev];if(longest){const mins=Math.round((longest[1]-longest[0])/60000),duration=mins>=60?`${Math.floor(mins/60)}h ${mins%60}m`:`${mins}m`;observing=`Moon-free dark sky: ${formatTime(longest[0])} – ${formatTime(longest[1])} · ${duration}`}}}
 return {rise,set,peak,observing}
}
function setLocation(next){locationData={...next};observer=observerFor(locationData);syncLocationControls();render()}
function syncLocationControls(){
 const select=document.querySelector("#locationSelect"),custom=document.querySelector("#customLocation");
 select.value=LOCATIONS[locationData.id]?locationData.id:"custom";custom.classList.toggle("hidden",select.value!=="custom");
 document.querySelector("#locationName").value=locationData.name||"";
 document.querySelector("#latitude").value=locationData.latitude;
 document.querySelector("#longitude").value=locationData.longitude;
 document.querySelector("#elevation").value=locationData.elevation||0;
 document.querySelector("#timezone").value=locationData.timeZone||"America/Denver";
}
function writeLocationUrl(u){
 if(LOCATIONS[locationData.id]){u.searchParams.set("location",locationData.id);["name","lat","lon","elevation","tz"].forEach(k=>u.searchParams.delete(k));}
 else{u.searchParams.delete("location");u.searchParams.set("name",locationData.name||"Custom location");u.searchParams.set("lat",locationData.latitude);u.searchParams.set("lon",locationData.longitude);u.searchParams.set("elevation",locationData.elevation||0);u.searchParams.set("tz",locationData.timeZone||"America/Denver");}
}
function render(){
 try{const {start,end}=intervalFor(selected); console.info("AstronomicalClock interval", {startUtc:start.toISOString(),startLocal:formatTime(start),endUtc:end.toISOString(),endLocal:formatTime(end),hours:(end-start)/3600000,zone:locationData.timeZone}); const samples=sampleNight(start,end,observer,5),allObjectTracks=sampleObjects(samples,observer),objectTracks=soloObject?allObjectTracks.filter(t=>t.key===soloObject):allObjectTracks.filter(t=>t.body?trackVisibility.planets:trackVisibility.deepSky),mid=new Date(start.getTime()+(end-start)/2),mi=moonInfo(mid);
 document.querySelector("#place").textContent=locationData.name;document.querySelector("#coords").textContent=`${Math.abs(locationData.latitude).toFixed(4)}° ${locationData.latitude>=0?"N":"S"}, ${Math.abs(locationData.longitude).toFixed(4)}° ${locationData.longitude>=0?"E":"W"} · ${Math.round(locationData.elevation)} m`;
 document.querySelector("#dateTitle").textContent=formatDate(selected);document.querySelector("#zone").textContent=`All times: ${locationData.timeZone} (${zoneLabel(start)})`;document.querySelector("#datePicker").value=selected;
 const today=localDateString(new Date(),locationData.timeZone);drawClock(document.querySelector("#clock"),samples,selected,selected===today,formatTime,wallClockMinutes,objectTracks,trackVisibility.moon);
 const objectColors=["#ffb347","#7dd3fc","#f9a8d4","#fb7185","#86efac","#c4b5fd","#fcd34d"],objectList=document.querySelector("#objectList");objectList.innerHTML="";
 allObjectTracks.forEach((track,i)=>{const peak=track.samples.reduce((best,s)=>s.altitude>best.altitude?s:best,track.samples[0]),row=document.createElement("div"),visible=track.body?trackVisibility.planets:trackVisibility.deepSky;row.className="object-row"+(visible?"":" object-muted");row.innerHTML=`<span class="object-name"><span class="object-dot" style="background:${objectColors[i%objectColors.length]}"></span>${track.name}</span><span class="object-alt">${peak.altitude>0?Math.round(peak.altitude)+"° max":"below horizon"}</span>`;row.title="Click to show only this object";row.addEventListener("click",()=>{soloObject=soloObject===track.key?null:track.key;render()});objectList.appendChild(row)});
 const ev=document.querySelector("#events");ev.innerHTML="";const rows=eventRows(start),fmt=d=>d?formatTime(d):"—",range=(a,b)=>a&&b?`${formatTime(a)} – ${formatTime(b)}`:"—";
 const solarBlock=(period,items)=>{const events=rows.filter(x=>x.label.startsWith(period+" ")),at=label=>events.find(x=>x.label===period+" "+label)?.date,group=document.createElement("section"),heading=document.createElement("div"),grid=document.createElement("div");group.className="solar-block";heading.className="event-heading";heading.textContent=period;grid.className="solar-grid";for(const [label,value] of items(at)){const a=document.createElement("div"),b=document.createElement("div");a.className="label solar-"+label.toLowerCase().replace(/\s+/g,"-");a.textContent=label;b.textContent=value;grid.append(a,b)}group.append(heading,grid);ev.appendChild(group)};
 solarBlock("Evening",at=>[
  ["Sunset",fmt(at("Sun center at horizon"))],
  ["Golden Hour",range(at("Golden hour (+6°)"),at("Golden / blue boundary"))],
  ["Blue Hour",range(at("Golden / blue boundary"),at("Blue-hour boundary"))],
  ["Civil Twilight",range(at("Sun center at horizon"),at("Civil twilight"))],
  ["Nautical Twilight",range(at("Civil twilight"),at("Nautical twilight"))],
  ["Astronomical Twilight",range(at("Nautical twilight"),at("Astronomical twilight"))]
 ]);
 solarBlock("Morning",at=>[
  ["Astronomical Twilight",range(at("Astronomical twilight"),at("Nautical twilight"))],
  ["Nautical Twilight",range(at("Nautical twilight"),at("Civil twilight"))],
  ["Civil Twilight",range(at("Civil twilight"),at("Sun center at horizon"))],
  ["Blue Hour",range(at("Blue-hour boundary"),at("Golden / blue boundary"))],
  ["Golden Hour",range(at("Golden / blue boundary"),at("Golden hour (+6°)"))],
  ["Sunrise",fmt(at("Sun center at horizon"))]
 ])
 const md=moonNightDetails(samples,rows);document.querySelector("#moonIllum").textContent=`${Math.round(mi.fraction*100)}% illuminated`;document.querySelector("#moonPhase").textContent=phaseName(mi.phase);document.querySelector("#moonSymbol").textContent=moonGlyph(mi.phase);document.querySelector("#moonRise").textContent=md.rise?formatTime(md.rise):"—";document.querySelector("#moonHighest").textContent=md.peak.moonAlt>0?`${formatTime(md.peak.date)} · ${Math.round(md.peak.moonAlt)}°`:"below horizon";document.querySelector("#moonSet").textContent=md.set?formatTime(md.set):"—";document.querySelector("#moonObserving").textContent=md.observing;
 document.querySelector("#error").textContent="";
 const u=new URL(location.href);u.searchParams.set("date",selected);writeLocationUrl(u);u.searchParams.set("moon",trackVisibility.moon?"1":"0");u.searchParams.set("planets",trackVisibility.planets?"1":"0");u.searchParams.set("deepSky",trackVisibility.deepSky?"1":"0");if(soloObject)u.searchParams.set("object",soloObject);else u.searchParams.delete("object");history.replaceState(null,"",u);
 }catch(e){document.querySelector("#error").textContent="Unable to calculate this date: "+e.message;console.error(e)}
}
document.querySelectorAll("[data-days]").forEach(b=>b.addEventListener("click",()=>addDays(Number(b.dataset.days))));
document.querySelector("#today").addEventListener("click",()=>{selected=localDateString(new Date(),locationData.timeZone);render()});
document.querySelector("#datePicker").addEventListener("change",e=>{if(e.target.value){selected=e.target.value;render()}});
function syncTrackToggles(){document.querySelector("#showMoon").checked=trackVisibility.moon;document.querySelector("#showPlanets").checked=trackVisibility.planets;document.querySelector("#showDeepSky").checked=trackVisibility.deepSky}
["Moon","Planets","DeepSky"].forEach(name=>document.querySelector("#show"+name).addEventListener("change",e=>{soloObject=null;trackVisibility[name==="Moon"?"moon":name==="Planets"?"planets":"deepSky"]=e.target.checked;render()}));
document.querySelector("#jumpBtn").addEventListener("click",()=>{const n=Math.max(-3650,Math.min(3650,Number(document.querySelector("#jump").value)||0));addDays(n)});
document.querySelector("#locationSelect").addEventListener("change",e=>{
 const id=e.target.value;document.querySelector("#customLocation").classList.toggle("hidden",id!=="custom");
 if(LOCATIONS[id])setLocation(LOCATIONS[id]);
});
document.querySelector("#applyLocation").addEventListener("click",()=>{
 const latitude=Number(document.querySelector("#latitude").value),longitude=Number(document.querySelector("#longitude").value);
 const status=document.querySelector("#locationStatus");
 if(!Number.isFinite(latitude)||latitude < -90||latitude > 90||!Number.isFinite(longitude)||longitude < -180||longitude > 180){status.textContent="Enter a valid latitude and longitude.";return}
 const timeZone=document.querySelector("#timezone").value.trim()||"America/Denver";
 try{new Intl.DateTimeFormat("en-US",{timeZone}).format(new Date())}catch{status.textContent="Enter a valid IANA time zone, such as America/Denver.";return}
 status.textContent="";
 setLocation({id:"custom",name:document.querySelector("#locationName").value.trim()||"Custom location",latitude,longitude,elevation:Number(document.querySelector("#elevation").value)||0,timeZone});
});
document.querySelector("#useLocation").addEventListener("click",()=>{
 const status=document.querySelector("#locationStatus");
 if(!navigator.geolocation){status.textContent="Browser location is not available here.";return}
 status.textContent="Requesting browser location…";
 navigator.geolocation.getCurrentPosition(pos=>{
  status.textContent="Browser location acquired. Check the timezone if this is outside your current region.";
  setLocation({id:"custom",name:"My location",latitude:pos.coords.latitude,longitude:pos.coords.longitude,elevation:Number.isFinite(pos.coords.altitude)?pos.coords.altitude:0,timeZone:locationData.timeZone||"America/Denver"});
 },err=>{status.textContent="Location was not available: "+err.message},{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
});
syncLocationControls();syncTrackToggles();render();
