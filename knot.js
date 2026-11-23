(() => {
  const scene = document.querySelector(".intro-method");
  if (!scene) return;
  const art = scene.querySelector(".thread-art");
  const svg = art.querySelector(".thread-trace");
  const trace = svg.querySelector(".thread-glint");
  const stations = [...scene.querySelectorAll(".thread-station")];
  const portrait = matchMedia("(max-width:860px) and (orientation:portrait)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const heading=scene.querySelector(".thread-heading"),header=document.createElement("div");
  const transport=document.createElement("button");
  header.className="thread-heading";
  heading.before(header);
  heading.className="thread-heading-title";
  transport.type="button";
  transport.className="thread-transport";
  header.append(heading,transport);
  scene.dataset.threadStory="";
  let timer=0,reading=false,paused=reduced.matches,band=0,position=0,high=0,manualAt=null;
  let pendingManual=false;
  let wordAnimations=[],echo=null;
  const curves = {
  "wide": {
    "width": 1600,
    "height": 850,
    "path": "M -60 493 C 132 538 286 513 421 434 C 540 375 672 228 771 209 C 920 177 940 307 812 423 C 711 515 623 498 643 400 C 668 277 859 286 966 409 C 1110 572 1050 675 909 618 C 751 554 772 388 921 370 C 1080 353 1154 462 1292 396 C 1433 332 1524 249 1660 281",
    "stitches": [
      [
        255,
        494
      ],
      [
        899,
        614
      ],
      [
        1288,
        399
      ]
    ]
  },
  "tall": {
    "width": 480,
    "height": 860,
    "path": "M -29 165 C 90 201 59 306 161 338 C 247 382 367 371 367 308 C 369 241 279 248 251 307 C 195 401 306 490 369 449 C 433 406 338 336 277 379 C 202 431 190 554 251 587 C 320 622 366 535 308 510 C 217 470 112 558 109 651 C 106 735 202 779 188 905",
    "stitches": [
      [
        78,
        246
      ],
      [
        210,
        438
      ],
      [
        109,
        660
      ]
    ]
  }
};
  let samples = [], distances = [], selected = 0, frame = 0, light = null, total = 0;

  function geometry() {
    cancelPulse();
    const view = portrait.matches ? curves.tall : curves.wide;
    svg.setAttribute("viewBox", `0 0 ${view.width} ${view.height}`);
    trace.setAttribute("d", view.path);
    total = trace.getTotalLength();
    samples = Array.from({length:501}, (_,i) => {
      const point = trace.getPointAtLength(total*i/500);
      return {x:point.x/view.width, y:point.y/view.height, length:total*i/500};
    });
    distances = view.stitches.map(([x,y], i) => {
      const nearest = samples.reduce((best, p) => {
        const gap = Math.hypot(p.x*view.width-x, p.y*view.height-y);
        return gap < best.gap ? {gap,p} : best;
      }, {gap:Infinity}).p;
      stations[i].style.setProperty("--pin-x", (100*nearest.x).toFixed(2)+"%");
      stations[i].style.setProperty("--pin-y", (100*nearest.y).toFixed(2)+"%");
      return nearest.length;
    });
  }
  function cancelPulse() {
    cancelAnimationFrame(frame);
    frame = 0;
    light = null;
    trace.style.opacity = "0";
  }
  function pulse(from,to) {
    cancelPulse();
    if (reduced.matches) return;
    const start = performance.now();
    const reach = Math.min(70, Math.abs(to-from)*.12);
    const duration = Math.min(1200, 420+Math.abs(to-from)*.35);
    function draw(time) {
      const t = Math.min(1,Math.max(0,(time-start)/duration));
      const position = from+(to-from)*t*t*(3-2*t);
      const length = Math.max(.1,reach*Math.sin(Math.PI*t));
      light = position;
      trace.style.strokeDasharray = length+" "+(total+length+1);
      trace.style.strokeDashoffset = String(-Math.max(0,position-length/2));
      trace.style.opacity = String(.88*Math.min(1,t*6,(1-t)*5));
      if(t<1) frame=requestAnimationFrame(draw);
      else cancelPulse();
    }
    frame=requestAnimationFrame(draw);
  }
  function clearWords(){
    wordAnimations.forEach(animation=>animation.cancel());
    wordAnimations=[];
    echo?.remove();
    echo=null;
  }
  function words(previous,index){
    if(reduced.matches || !scene.animate)return;
    const previousStation=stations[previous],next=stations[index];
    const easing="cubic-bezier(.16,.72,.23,1)";
    function animate(el,frames,time,delay=0){
      wordAnimations.push(el.animate(frames,{duration:time,delay,easing,fill:"backwards"}));
    }
    if(previous!==index){
      const caption=previousStation.querySelector(".stitch-caption");
      const rise=Math.min(44,Math.max(21,caption.offsetHeight*.52));
      animate(caption,[
        {transform:"none",opacity:1},
        {transform:`translateY(-${rise}px) scale(.94)`,opacity:0,offset:.54},
        {transform:"translateY(5px) scale(.82)",opacity:0,offset:.62},
        {transform:"scale(.82)",opacity:.67}
      ],465);
      echo=previousStation.querySelector(".stitch-note").cloneNode(true);
      echo.className="stitch-echo";
      echo.hidden=false;
      echo.removeAttribute("id");
      echo.setAttribute("aria-hidden","true");
      previousStation.append(echo);
      const leaving=echo;
      const fade=leaving.animate([{transform:"none",opacity:.88},{transform:"translateY(-14px)",opacity:0}],{duration:230,easing,fill:"forwards"});
      fade.onfinish=()=>{leaving.remove();if(echo===leaving)echo=null};
      wordAnimations.push(fade);
    }
    animate(next.querySelector(".stitch-meta"),[{opacity:0,transform:"translateY(9px)"},{opacity:1,transform:"none"}],350,50);
    animate(next.querySelector(".stitch-caption strong"),[{opacity:0,transform:"translateY(.53em)"},{opacity:1,transform:"none"}],540,88);
    animate(next.querySelector(".stitch-note"),[{opacity:0,transform:"translateY(10px)"},{opacity:1,transform:"none"}],450,220);
  }
  function select(index,entrance=false) {
    if(index===selected && !entrance) {
      pulse(Math.max(0,distances[index]-total*.14),distances[index]);
      return;
    }
    clearWords();
    const previous=selected;
    const from = light ?? distances[selected];
    selected = index;
    stations.forEach((station,i) => {
      station.querySelector("button").setAttribute("aria-pressed",String(i===index));
      station.querySelector(".stitch-note").hidden=i!==index;
      if (i===index) station.querySelector("button").setAttribute("aria-describedby","thread-note-"+i);
      else station.querySelector("button").removeAttribute("aria-describedby");
    });
    words(entrance?index:previous,index);
    if(!entrance)pulse(from,distances[selected]);
  }
  function updateTransport(){
    const state=selected===stations.length-1?"replay":paused?"play":"pause";
    const label=state==="replay"?"从头播放设计手记":state==="play"?"继续自动翻阅":"暂停自动翻阅";
    transport.dataset.state=state;
    transport.setAttribute("aria-label",label);
    transport.title=label;
  }
  function clock(){
    clearTimeout(timer);
    updateTransport();
    if(!reading||paused||document.hidden||selected===stations.length-1)return;
    timer=setTimeout(()=>{select(selected+1);clock()},3000);
  }
  function manual(index){
    paused=true;
    pendingManual=!reading;
    manualAt=position;
    high=position;
    select(index);
    clock();
  }
  function track(event){
    const {threadReading,threadPosition}=event.detail;
    if(!threadReading){
      if(scene.inert)pendingManual=false;
      if(reading){
        reading=false;
        clearTimeout(timer);
        cancelPulse();
        clearWords();
      }
      return;
    }
    const nextBand=threadPosition>=.72?2:threadPosition>=.355?1:0;
    position=threadPosition;
    if(!reading){
      reading=true;
      high=position;band=nextBand;
      if(pendingManual){
        pendingManual=false;
        manualAt=position;
        clock();
        return;
      }
      paused=reduced.matches;
      manualAt=null;
      select(band,true);
      clock();
      return;
    }
    if(manualAt!==null&&Math.abs(position-manualAt)<.12)return;
    manualAt=null;
    const forward=nextBand>band&&nextBand>selected;
    const backward=(nextBand<band||high-position>.14)&&nextBand<selected;
    if(forward||backward){select(nextBand);clock()}
    high=backward?position:Math.max(high,position);
    band=nextBand;
  }
  transport.addEventListener("click",()=>{
    if(selected===stations.length-1){select(0);paused=false}
    else paused=!paused;
    manualAt=position;
    high=position;
    clock();
  });
  window.addEventListener("thread-restart",()=>{
    pendingManual=false;
    if(!reading)return;
    paused=reduced.matches;
    manualAt=null;
    select(0,true);
    clock();
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){clearTimeout(timer);cancelPulse()}
    else clock();
  });
  function preferences(){
    paused=reduced.matches;
    clearWords();
    cancelPulse();
    clock();
  }
  stations.forEach((station,i) => {
    const button = station.querySelector("button");
    button.addEventListener("click",()=>manual(i));
    button.addEventListener("focus",()=>{paused=true;clock()});
    button.addEventListener("keydown",event=>{
      const keys={ArrowLeft:(i+2)%3,ArrowRight:(i+1)%3,Home:0,End:2};
      if(!(event.key in keys)) return;
      event.preventDefault();
      const index=keys[event.key];
      manual(index);
      stations[index].querySelector("button").focus({preventScroll:true});
    });
  });
  // The fabric has narrow hit geometry. Whitespace around it stays available for scrolling.
  art.addEventListener("click",event=>{
    const bounds=art.getBoundingClientRect();
    const x=event.clientX-bounds.left, y=event.clientY-bounds.top;
    let nearest=null, gap=Infinity;
    for(const p of samples) {
      const d=Math.hypot(p.x*bounds.width-x,p.y*bounds.height-y);
      if(d<gap){ gap=d; nearest=p; }
    }
    if(!nearest || gap>Math.max(15,bounds.width*.011)) return;
    const closest=distances.reduce((best,v,i)=>Math.abs(nearest.length-v)<Math.abs(nearest.length-distances[best]) ? i : best,0);
    manual(closest);
  });
  geometry();
  portrait.addEventListener("change",geometry);
  reduced.addEventListener("change",preferences);
  window.addEventListener("film-progress",track);
  updateTransport();
  window.dispatchEvent(new Event("film-refresh"));
})();
