(() => {
  const top = document.querySelector("#top");
  const track = top?.querySelector(".cover-track");
  if (!track) return;
  const touch = track.querySelector(".branch-touch"), key = track.querySelector(".branch-key");
  const label = key.querySelector("span"), picture = track.querySelector("picture");
  const rings = [...track.querySelectorAll(".branch-echo i")];
  const footer = document.querySelector("body > footer"), nav = top.querySelector(".cover-nav");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const notes = ["宫","商","角","徵","羽"];
  let note = 4, reset = 0, inside = false, navVisible = true, footerVisible = false, shot = "whole";
  function visibility() {
    top.classList.toggle("air-awake", inside && shot==="whole" && !document.hidden);
    document.body.classList.toggle("music-away", !navVisible && !footerVisible);
  }
  const observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.target===top) inside=e.isIntersecting; else if (e.target===nav) navVisible=e.isIntersecting; else footerVisible=e.isIntersecting;
    }
    visibility();
  });
  observer.observe(top); observer.observe(nav); if (footer) observer.observe(footer);
  window.addEventListener("film-progress",() => {
    if (shot!==top.dataset.camera) {shot=top.dataset.camera;visibility()}
  });
  document.addEventListener("visibilitychange",visibility);
  function pluck(n) {
    note=(n+notes.length)%notes.length;
    clearTimeout(reset); label.textContent=notes[note];
    reset=setTimeout(()=>{label.textContent="拨枝"},1450);
    if (!reduced.matches) {
      picture.getAnimations().forEach(a=>a.cancel());
      const bend=(note-2)*.65+2.5;
      picture.animate([0,-bend,bend*.51,-bend*.27,bend*.09,0].map((v,i)=>({
        transform:"rotate("+v+"deg) translateY("+(-v*.8)+"px)",offset:[0,.11,.28,.49,.72,1][i]
      })),{duration:760,easing:"ease-out"});
      rings.forEach((ring,i)=>{
        ring.getAnimations().forEach(a=>a.cancel());
        ring.animate([{opacity:0,transform:"scale(.22)"},{opacity:.63,offset:.15},
          {opacity:0,transform:"scale("+(2.9+i*.35)+")"}],{duration:740+i*85,delay:i*80,easing:"ease-out"});
      });
    }
    window.dispatchEvent(new CustomEvent("branch-pluck",{detail:{note}}));
  }
  function positionNote(e){
    const rect=touch.getBoundingClientRect();
    return Math.max(0,Math.min(4,Math.floor((e.clientX-rect.left)*5/rect.width)));
  }
  let playing=null,lastZone=-1;
  touch.addEventListener("pointerdown",e=>{
    if (!e.isPrimary || e.button!==0) return;
    playing=e.pointerId;lastZone=positionNote(e);pluck(lastZone);
  });
  touch.addEventListener("pointermove",e=>{
    if (e.pointerId!==playing || !e.buttons) return;
    const n=positionNote(e); if (n!==lastZone){lastZone=n;pluck(n)}
  });
  const release=()=>{playing=null};
  touch.addEventListener("pointerleave", release);
  touch.addEventListener("pointercancel", release);
  window.addEventListener("pointerup", release, {passive:true});
  key.addEventListener("click",()=>pluck(note+1));
  key.addEventListener("keydown",e=>{
    if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
    e.preventDefault();pluck(note+(e.key==="ArrowLeft"?-1:1));
  });
})();