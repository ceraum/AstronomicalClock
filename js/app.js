import { LOCATIONS, locationFromUrl } from "./locations.js";
import { observerFor, sampleNight, moonInfo, solarEvents } from "./astronomy.js";
import { drawClock } from "./clock.js";

const params=new URLSearchParams(location.search),locationData=locationFromUrl(params),observer=observerFor(locationData);
const app=document.querySelector("#app");if(params.get("embed")==="1")app.classList.add("embed");
let selected=params.get("date")||localDateString(new Date(),locationData.timeZone);

function parts(date,tz){return Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(p=>p.type!=="literal").map(p=>[p.type,p.value]))}
function offsetMs(date,tz){const p=parts(date,tz),asUtc=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);return asUtc-date.getTime()+date.getMilliseconds()}
function zonedDate(y,m,d,h,tz){let guess=new Date(Date.UTC(y,m-1,d,h));for(let i=0;i<3;i++)guess=new Date(Date.UTC(y,m-1,d,h)-offsetMs(guess,tz));return guess}
function localDateString(date,tz){const p=parts(date,tz);return `${p.year}-${p.month}-${p.day}`}
function startFor(dateStr){const[y,m,d]=dateStr.split("-").map(Number);return zonedDate(y,m,d,12,locationData.timeZone)}
function formatTime(d){return new Intl.DateTimeFormat("en-US",{timeZone:locationData.timeZone,hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(d)}
function formatDate(dateStr){const[y,m,d]=dateStr.split("-").map(Number);return new Intl.DateTimeFormat("en-US",{dateStyle:"full",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,d)))}
function addDays(n){const[y,m,d]=selected.split("-").map(Number),x=new Date(Date.UTC(y,m-1,d+n));selected=x.toISOString().slice(0,10);render()}
function phaseName(angle){const a=((angle%360)+360)%360;if(a<22.5||a>=337.5)return"New Moon";if(a<67.5)return"Waxing crescent";if(a<112.5)return"First quarter";if(a<157.5)return"Waxing gibbous";if(a<202.5)return"Full Moon";if(a<247.5)return"Waning gibbous";if(a<292.5)return"Last quarter";return"Waning crescent"}
function moonGlyph(angle){const a=((angle%360)+360)%360;return a<22.5||a>=337.5?"●":a<67.5?"◔":a<112.5?"◐":a<157.5?"◕":a<202.5?"○":a<247.5?"◕":a<292.5?"◑":"◔"}
function eventRows(start){return solarEvents(start,observer)}
function render(){
 try{const start=startFor(selected); console.info("AstronomicalClock start", {utc:start.toISOString(), local:formatTime(start), zone:locationData.timeZone}); const samples=sampleNight(start,observer,5),mid=new Date(start.getTime()+12*3600000),mi=moonInfo(mid);
 document.querySelector("#place").textContent=locationData.name;document.querySelector("#coords").textContent=`${Math.abs(locationData.latitude).toFixed(4)}° ${locationData.latitude>=0?"N":"S"}, ${Math.abs(locationData.longitude).toFixed(4)}° ${locationData.longitude>=0?"E":"W"} · ${Math.round(locationData.elevation)} m`;
 document.querySelector("#dateTitle").textContent=formatDate(selected);document.querySelector("#zone").textContent=locationData.timeZone;document.querySelector("#datePicker").value=selected;
 const today=localDateString(new Date(),locationData.timeZone);drawClock(document.querySelector("#clock"),samples,selected,selected===today,formatTime);
 const ev=document.querySelector("#events");ev.innerHTML="";for(const r of eventRows(start)){const a=document.createElement("div"),b=document.createElement("div");a.className="label";a.textContent=r.label;b.textContent=formatTime(r.date);ev.append(a,b)}
 document.querySelector("#moonIllum").textContent=`${Math.round(mi.fraction*100)}% illuminated`;document.querySelector("#moonPhase").textContent=phaseName(mi.phase);document.querySelector("#moonSymbol").textContent=moonGlyph(mi.phase);
 const firstEvent=eventRows(start)[0];
 document.querySelector("#error").textContent=`DEBUG — noon anchor: ${formatTime(start)} / ${start.toISOString()} · Sun altitude at anchor: ${samples[0].sunAlt.toFixed(1)}° · first event UTC: ${firstEvent?firstEvent.date.toISOString():"none"}`;
 const u=new URL(location.href);u.searchParams.set("date",selected);history.replaceState(null,"",u);
 }catch(e){document.querySelector("#error").textContent="Unable to calculate this date: "+e.message;console.error(e)}
}
document.querySelectorAll("[data-days]").forEach(b=>b.addEventListener("click",()=>addDays(Number(b.dataset.days))));
document.querySelector("#today").addEventListener("click",()=>{selected=localDateString(new Date(),locationData.timeZone);render()});
document.querySelector("#datePicker").addEventListener("change",e=>{if(e.target.value){selected=e.target.value;render()}});
document.querySelector("#jumpBtn").addEventListener("click",()=>{const n=Math.max(-3650,Math.min(3650,Number(document.querySelector("#jump").value)||0));addDays(n)});
render();
