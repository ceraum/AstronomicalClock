const NS="http://www.w3.org/2000/svg";
const COLORS={day:"#a9d5f2",golden:"#d7a24a",civil:"#526f9c",blue:"#365a8c",nautical:"#263f69",astronomical:"#192b4d",night:"#0c1424",moon:"#f1f0d5"};
function node(tag,a={}){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(a))n.setAttribute(k,v);return n}
function polar(cx,cy,r,a){return[cx+r*Math.sin(a),cy-r*Math.cos(a)]}
function ringSector(cx,cy,r1,r2,a1,a2,fill){const p1=polar(cx,cy,r2,a1),p2=polar(cx,cy,r2,a2),p3=polar(cx,cy,r1,a2),p4=polar(cx,cy,r1,a1),large=a2-a1>Math.PI?1:0;return node("path",{d:`M ${p1} A ${r2} ${r2} 0 ${large} 1 ${p2} L ${p3} A ${r1} ${r1} 0 ${large} 0 ${p4} Z`,fill})}
function band(alt){if(alt>=6)return"day";if(alt>=-4)return"golden";if(alt>=-6)return"civil";if(alt>=-12)return"nautical";if(alt>=-18)return"astronomical";return"night"}
const OBJECT_COLORS=["#ffb347","#7dd3fc","#f9a8d4","#fb7185","#86efac","#c4b5fd","#fcd34d"];
export function drawClock(svg,samples,selectedDate,isToday,formatTime,wallClockMinutes,objectTracks=[],showMoon=true){
 svg.innerHTML="";const cx=350,cy=350,r0=150,r1=285,rotation=Math.PI;
 const angleFor=date=>rotation+wallClockMinutes(date)/1440*2*Math.PI;
 for(let i=0;i<samples.length-1;i++){const a1=angleFor(samples[i].date);let a2=angleFor(samples[i+1].date);if(a2<a1-1)a2+=2*Math.PI;svg.appendChild(ringSector(cx,cy,r0,r1,a1,a2,COLORS[band((samples[i].sunAlt+samples[i+1].sunAlt)/2)]))}
 // blue hour overlay
 for(let i=0;i<samples.length-1;i++){const alt=(samples[i].sunAlt+samples[i+1].sunAlt)/2;if(alt>=-8&&alt<-4){const a1=angleFor(samples[i].date);let a2=angleFor(samples[i+1].date);if(a2<a1-1)a2+=2*Math.PI;svg.appendChild(ringSector(cx,cy,r1-18,r1,a1,a2,COLORS.blue))}}
 [0,30,60,90].forEach(alt=>{const r=r0+(r1-r0)*alt/90;svg.appendChild(node("circle",{cx,cy,r,fill:"none",stroke:"#65738a","stroke-width":".8",opacity:".5"}))});
 for(let h=0;h<24;h++){const a=rotation+h/24*2*Math.PI,p1=polar(cx,cy,r0,a),p2=polar(cx,cy,r1+(h%3===0?8:3),a);svg.appendChild(node("line",{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:"#8090a8","stroke-width":h%3===0?1.2:.6,opacity:h%3===0?.7:.35}));if(h%3===0){const p=polar(cx,cy,r1+28,a),t=node("text",{x:p[0],y:p[1]+5,"text-anchor":"middle",fill:"#aebbd0","font-size":"13"});t.textContent=h===0?"NOON":h===12?"MIDNIGHT":((12+h)%24||24);svg.appendChild(t)}}
 if(showMoon){let d="";samples.forEach((s,i)=>{const alt=Math.max(0,s.moonAlt),r=r0+(r1-r0)*alt/90,a=angleFor(s.date),p=polar(cx,cy,r,a);d+=(i?"L":"M")+p[0]+" "+p[1]+" "});svg.appendChild(node("path",{d,fill:"none",stroke:COLORS.moon,"stroke-width":"3","stroke-linecap":"round",opacity:".95"}));}
 objectTracks.forEach((track,index)=>{
  let path="",drawing=false;
  track.samples.forEach(s=>{
   if(s.altitude<0){drawing=false;return}
   const r=r0+(r1-r0)*Math.min(90,s.altitude)/90,a=angleFor(s.date),p=polar(cx,cy,r,a);
   path+=(drawing?"L":"M")+p[0]+" "+p[1]+" ";drawing=true;
  });
  if(path)svg.appendChild(node("path",{d:path,fill:"none",stroke:OBJECT_COLORS[index%OBJECT_COLORS.length],"stroke-width":"2","stroke-linecap":"round",opacity:".9","data-object":track.key}));
 });
 const center=node("circle",{cx,cy,r:r0-4,fill:"#0b1019",stroke:"#344258","stroke-width":"1.5"});svg.appendChild(center);
 const title=node("text",{x:cx,y:cy-12,"text-anchor":"middle",fill:"#eef4ff","font-size":"20","font-weight":"600"});title.textContent=selectedDate;svg.appendChild(title);
 const subtitle=node("text",{x:cx,y:cy+17,"text-anchor":"middle",fill:"#9cabc0","font-size":"13"});subtitle.textContent="local noon → local noon";svg.appendChild(subtitle);
 if(isToday){const now=new Date(),start=samples[0].date,end=samples[samples.length-1].date;if(now>=start&&now<=end){const a=angleFor(now),p=polar(cx,cy,r1+8,a);svg.appendChild(node("line",{x1:cx,y1:cy,x2:p[0],y2:p[1],stroke:"#ffffff","stroke-width":"2.5",opacity:".9"}));const tx=node("text",{x:cx,y:cy+42,"text-anchor":"middle",fill:"#eef4ff","font-size":"12"});tx.textContent="Now "+formatTime(now);svg.appendChild(tx)}}
}
