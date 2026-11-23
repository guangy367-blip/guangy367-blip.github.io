(() => {
  const scene = document.querySelector(".intro-method");
  if (!scene) return;
  const art = scene.querySelector(".thread-art");
  const svg = art.querySelector(".thread-trace");
  const trace = svg.querySelector(".thread-glint");
  const stations = [...scene.querySelectorAll(".thread-station")];
  const portrait = matchMedia("(max-width:860px) and (orientation:portrait)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
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
  function select(index) {
    if(index===selected) {
      pulse(Math.max(0,distances[index]-total*.14),distances[index]);
      return;
    }
    const from = light ?? distances[selected];
    selected = index;
    stations.forEach((station,i) => {
      station.querySelector("button").setAttribute("aria-pressed",String(i===index));
      station.querySelector(".stitch-note").hidden=i!==index;
      if (i===index) station.querySelector("button").setAttribute("aria-describedby","thread-note-"+i);
      else station.querySelector("button").removeAttribute("aria-describedby");
    });
    pulse(from,distances[selected]);
  }
  stations.forEach((station,i) => {
    const button = station.querySelector("button");
    button.addEventListener("click",()=>select(i));
    button.addEventListener("keydown",event=>{
      const keys={ArrowLeft:(i+2)%3,ArrowRight:(i+1)%3,Home:0,End:2};
      if(!(event.key in keys)) return;
      event.preventDefault();
      const index=keys[event.key];
      select(index);
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
    if(closest===selected) pulse(nearest.length,distances[selected]);
    else select(closest);
  });
  geometry();
  portrait.addEventListener("change",geometry);
  reduced.addEventListener("change",cancelPulse);
  window.addEventListener("film-progress",()=>{if(frame && scene.inert)cancelPulse()});
})();
