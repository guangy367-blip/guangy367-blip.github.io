(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const scene = document.querySelector(".studio-scene");
  const studio = document.querySelector(".studio");
  let frame = 0, x = 0, y = 0, active = true;
  function paint() {
    frame = 0;
    if (!active || motion.matches || innerWidth < 760) return;
    const scroll = Math.max(0, Math.min(1, -studio.getBoundingClientRect().top / studio.offsetHeight));
    scene.style.transform = "translate3d(" + x + "px," + (y + scroll*16).toFixed(1) + "px,0) scale(" + (1.026 + scroll*.085).toFixed(3) + ")";
  }
  function queue(){if(!frame && active && !motion.matches)frame=requestAnimationFrame(paint);}
  if ("IntersectionObserver" in window) {
    const observer=new IntersectionObserver(([entry])=>{active=entry.isIntersecting;if(active)queue();});observer.observe(studio);
  }
  addEventListener("scroll",queue,{passive:true});
  studio.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse")return;x=(.5-e.clientX/innerWidth)*8;y=(.5-e.clientY/innerHeight)*5;queue();});
  studio.addEventListener("pointerleave",()=>{x=0;y=0;queue();});
  const modes = [...document.querySelectorAll("[data-view]")];
  modes.forEach(button => button.addEventListener("click",() => {
    document.querySelector("#cards").classList.toggle("list",button.dataset.view === "list");
    modes.forEach(el => el.setAttribute("aria-pressed",String(el === button)));
  }));
  const box=document.querySelector("#contact"), status=document.querySelector("#copy-status");
  document.querySelectorAll("[data-contact]").forEach(b=>b.addEventListener("click",()=>{
    status.textContent="";box.showModal();document.body.style.overflow="hidden";
  }));
  box.addEventListener("close",()=>document.body.style.overflow="");
  box.addEventListener("click",e=>{if(e.target===box)box.close();});
  document.querySelector("#dismiss").addEventListener("click",()=>box.close());
  document.querySelector("#copy-email").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText("2100391483@qq.com");status.textContent="邮箱已复制";}
    catch{const range=document.createRange();range.selectNodeContents(box.querySelector(".mail"));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);status.textContent="已选中邮箱，可直接复制";}
  });
  if("IntersectionObserver" in window && !motion.matches){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(!entry.isIntersecting)return;
        entry.target.animate([{transform:"translateY(16px)",opacity:.58},{transform:"none",opacity:1}],{duration:480,easing:"cubic-bezier(.2,.75,.2,1)"});
        observer.unobserve(entry.target);
      });
    },{threshold:.12});
    document.querySelectorAll(".card,.bio").forEach(el=>observer.observe(el));
  }
})();
