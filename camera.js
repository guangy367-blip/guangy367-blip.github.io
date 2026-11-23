(() => {
  const reel=document.getElementById("cover-reel");
  if (!reel) return;
  const stage=reel.querySelector(".folio-cover");
  const acts=[...stage.querySelectorAll("[data-shot]")];
  const controls=[...stage.querySelectorAll("[data-lens]")];
  const lanyard=stage.querySelector(".film-lanyard");
  const cue=stage.querySelector(".film-cue"), hint=cue.querySelector(".film-hint");
  const meter=cue.querySelector(".film-meter i"), reader=stage.querySelector(".camera-reader");
  const branch=stage.querySelector(".cover-track"),glyphs=[...stage.querySelectorAll(".name-lockup>span")];
  const portrait=stage.querySelector(".intro-portrait"), disc=stage.querySelector(".portrait-disc");
  const reduced=matchMedia("(prefers-reduced-motion:reduce)");
  const narrow=matchMedia("(max-width:760px) and (orientation:portrait)");
  const titles=acts.map(panel=>[...panel.querySelectorAll(".intro-line>span")]);
  const stops=[0,.47,.94];
  const limit=x=>Math.max(0,Math.min(1,x));
  function ease(value,from,to){
    const t=limit((value-from)/(to-from));
    return t*t*(3-2*t);
  }
  let origin=0,travel=1,frame=0,last=-1,active=-1;
  function activate(index){
    if(active===index)return;
    active=index;stage.dataset.camera=controls[index].dataset.lens;
    controls.forEach((b,i)=>b.setAttribute("aria-pressed",String(index===i)));
    acts.forEach((act,i)=>{act.inert=i!==index;act.setAttribute("aria-hidden",String(i!==index))});
    reader.textContent="个人序章："+controls[index].textContent;
    hint.textContent=index===2?"进入作品集":"向下翻阅";
  }
  function paint(){
    frame=0;
    const p=limit((window.scrollY-origin)/travel);
    if(last===p)return;
    last=p;
    const index=p<.26?0:p<.69?1:2;
    activate(index);
    const q=reduced.matches?stops[index]:p;
    const paper=ease(q,.105,.395), ink=ease(q,.545,.825);
    acts[0].style.visibility=paper===1?"hidden":"visible";
    acts[1].style.visibility=paper===0||ink===1?"hidden":"visible";
    acts[2].style.visibility=ink===0?"hidden":"visible";

    // The second sheet rises from the foot. The third travels horizontally,
    // with lettering and subject moving on separate planes behind the edge.
    acts[1].style.transform="translate3d(0,"+(100*(1-paper))+"%,0)";
    acts[2].style.transform="translate3d("+(100*(1-ink))+"%,0,0)";
    const recoil=ease(q,.025,.245);
    lanyard.style.transform="translate3d("+(-3*recoil)+"vw,"+(-110*recoil)+"%,0) rotate("+(-7*recoil)+"deg)";
    lanyard.inert=recoil>.87;lanyard.style.visibility=recoil===1?"hidden":"visible";
    if(paper<1){
      branch.style.transform="translate3d("+(-15*paper)+"vw,"+(7*paper)+"svh,0) rotate("+(-7-24*paper)+"deg) scale("+(1+.35*paper)+")";
      glyphs.forEach((el,i)=>{
        const exit=ease(q,.075+i*.021,.31+i*.021);
        el.style.transform="translate3d(0,"+(-34*exit)+"%,0) rotate("+(-4*exit)+"deg)";
        el.style.opacity=1-exit;
      });
    }
    if(paper>0 && ink<1){
      portrait.style.transform="translate3d("+(-4*ink)+"%,"+((1-paper)*13+ink*6)+"%,0) scale("+(.97+.035*paper)+")";
      disc.style.transform="translate3d("+(-9*(1-paper)+ink*4)+"%,"+(12*(1-paper))+"%,0)";
    }
    [paper,ink].forEach((entrance,i)=>{
      if(!entrance)return;
      titles[i+1].forEach((line,n)=>{
        const t=ease(entrance,.025+n*.11,.84+n*.11);
        line.style.transform="translate3d("+((i===1?1:0)*(1-t)*-12)+"%,"+((1-t)*97)+"%,0)";
      });
    });
    meter.style.transform="scaleX("+(.06+.94*p)+")";
    stage.dataset.knotVisible=String(ink>0);
    window.dispatchEvent(new CustomEvent("film-progress",{detail:{progress:p,knotReveal:ink}}));
  }
  function queue(){if(!frame)frame=requestAnimationFrame(paint)}
  function measure(){
    origin=reel.getBoundingClientRect().top+window.scrollY;
    travel=Math.max(1,reel.offsetHeight-stage.offsetHeight);last=-1;queue();
  }
  function jump(i){window.scrollTo({top:origin+stops[i]*travel,behavior:reduced.matches?"instant":"smooth"})}
  controls.forEach((b,i)=>{
    b.addEventListener("click",()=>jump(i));
    b.addEventListener("keydown",e=>{
      const keys={ArrowLeft:(i+2)%3,ArrowRight:(i+1)%3,Home:0,End:2};
      if(!(e.key in keys))return;
      e.preventDefault();controls[keys[e.key]].focus({preventScroll:true});jump(keys[e.key]);
    });
  });
  cue.addEventListener("click",e=>{
    if(active===2||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();jump(active+1);
  });
  reel.classList.add("film-ready");measure();
  if("ResizeObserver" in window)new ResizeObserver(measure).observe(reel);
  window.addEventListener("resize",measure,{passive:true});
  window.addEventListener("scroll",queue,{passive:true});
  window.addEventListener("pageshow",measure);
  reduced.addEventListener("change",measure);narrow.addEventListener("change",measure);
})();
