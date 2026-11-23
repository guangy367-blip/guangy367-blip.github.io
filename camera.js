(() => {
  const reel = document.getElementById("cover-reel");
  if (!reel) return;
  const stage = reel.querySelector(".folio-cover");
  const art = stage.querySelector(".cover-art");
  const track = art.querySelector(".cover-track");
  const controls = [...stage.querySelectorAll("[data-lens]")];
  const copies = [...stage.querySelectorAll("[data-shot]")];
  const lines = copies.map(panel => [...panel.querySelectorAll(".film-line")]);
  const lanyard = stage.querySelector(".film-lanyard");
  const meter = stage.querySelector(".film-meter i");
  const cue = stage.querySelector(".film-cue");
  const hint = stage.querySelector(".film-hint");
  const reader = stage.querySelector(".camera-reader");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const portrait = matchMedia("(max-width: 760px) and (orientation: portrait)");

  // The three stops share the same artwork. x/y use viewport units so the
  // knot can travel across the screen without swapping or decoding new scenes.
  const desktopPoses = [[0,0,0,0,0,1],[-19,3,-39,-25,9,1.54],[22,19,14,9,-5,2.65]];
  const mobilePoses = [[0,0,0,0,0,1],[-7,-11,-30,-19,6,1.38],[7,-10,12,5,-3,2.45]];
  const stops = [0,.5,.91];
  const clamp = value => Math.max(0,Math.min(1,value));
  function ease(value,start,end) {
    const t = clamp((value-start)/(end-start));
    return t*t*(3-2*t);
  }
  let origin=0, travel=1, frame=0, previous=-1, active=-1, upgraded=false;
  function activate(index) {
    if (active===index) return;
    active=index;
    const lens=controls[index].dataset.lens;
    stage.dataset.camera=lens;
    controls.forEach((button,i)=>button.setAttribute("aria-pressed",String(i===index)));
    copies.forEach((panel,i)=>{
      panel.inert=i!==index;
      panel.setAttribute("aria-hidden",String(i!==index));
    });
    reader.textContent="当前视角为"+controls[index].textContent;
    art.setAttribute("aria-label",reader.textContent+"，切换到"+controls[(index+1)%controls.length].textContent);
    hint.textContent=index===2?"继续浏览作品":"向下滚动换镜";
  }
  function paint() {
    frame=0;
    const p=clamp((window.scrollY-origin)/travel);
    if (p===previous) return;
    previous=p;
    const index=p<.25?0:p<.675?1:2;
    activate(index);
    const position=reduced.matches?stops[index]:p;
    const segment=position<.50?0:1;
    const fraction=segment===0?ease(position,.055,.47):ease(position,.54,.90);
    const poses=portrait.matches?mobilePoses:desktopPoses;
    const [x,y,z,ry,rx,scale]=poses[segment].map((v,i)=>v+(poses[segment+1][i]-v)*fraction);
    track.style.transform="translate3d("+x+"vw,"+y+"svh,0) rotateZ("+z+"deg) rotateY("+ry+"deg) rotateX("+rx+"deg) scale("+scale+")";
    if (!upgraded && p>.57 && portrait.matches) {
      art.querySelector("source").srcset="media/hero-cover.webp";
      upgraded=true;
    }
    // Letterforms stay intact. Each line passes through its own reveal window.
    lines.forEach((group,i)=>{
      const visible=i===index || (!reduced.matches && (i===0?p<.32:i===1?p>.17&&p<.76:p>.60));
      copies[i].style.visibility=visible?"visible":"hidden";
      if (!visible) return;
      group.forEach((line,n)=>{
        const lag=n*.012;
        const enter=i===0?1:ease(position,(i===1?.17:.60)+lag,(i===1?.32:.76)+lag);
        const leave=i===2?0:ease(position,(i===0?.105:.55)+lag,(i===0?.29:.72)+lag);
        const alpha=reduced.matches?1:enter*(1-leave);
        line.style.opacity=alpha;
        line.style.transform=reduced.matches?"none":"translate3d(0,"+((1-enter)*100-leave*83)+"%,0)";
      });
    });
    const recoil=ease(position,.045,.29);
    lanyard.style.transform="translate3d(0,"+(-recoil*106)+"%,0)";
    lanyard.style.opacity=1-ease(position,.18,.29);
    lanyard.inert=recoil>.90;
    lanyard.style.visibility=recoil===1?"hidden":"visible";
    meter.style.transform="scaleX("+(.08+p*.92)+")";
    window.dispatchEvent(new CustomEvent("film-progress",{detail:{progress:p}}));
  }
  function requestPaint() {
    if (!frame) frame=requestAnimationFrame(paint);
  }
  function measure() {
    origin=reel.getBoundingClientRect().top+window.scrollY;
    travel=Math.max(1,reel.offsetHeight-stage.offsetHeight);
    previous=-1;
    requestPaint();
  }
  function jump(index) {
    window.scrollTo({top:origin+travel*stops[index],behavior:reduced.matches?"instant":"smooth"});
  }
  controls.forEach((button,i)=>{
    button.addEventListener("click",()=>jump(i));
    button.addEventListener("keydown",event=>{
      const last=controls.length-1;
      const keys={ArrowLeft:(i+last)%controls.length,ArrowRight:(i+1)%controls.length,Home:0,End:last};
      if (!(event.key in keys)) return;
      event.preventDefault();
      const next=keys[event.key];
      controls[next].focus({preventScroll:true});
      jump(next);
    });
  });
  art.addEventListener("click",()=>jump((active+1)%controls.length));
  cue.addEventListener("click",event=>{
    if (active===2 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    jump(active+1);
  });
  reel.classList.add("film-ready");
  measure();
  if ("ResizeObserver" in window) new ResizeObserver(measure).observe(reel);
  window.addEventListener("resize",measure,{passive:true});
  window.addEventListener("scroll",requestPaint,{passive:true});
  window.addEventListener("pageshow",measure);
  reduced.addEventListener("change",measure);
  portrait.addEventListener("change",measure);
})();
