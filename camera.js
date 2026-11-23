(() => {
  const reel = document.getElementById("cover-reel");
  if (!reel) return;
  const stage = reel.querySelector("#top");
  const acts = [...stage.querySelectorAll("[data-shot]")];
  const controls = [...stage.querySelectorAll("[data-lens]")];
  const branch = stage.querySelector(".cover-track"), heading = stage.querySelector(".cover-heading");
  const cord = stage.querySelector(".film-lanyard"), portrait = stage.querySelector(".portrait-composition");
  const resume = [...stage.querySelectorAll(".cv-kicker,.cv-social,.cv-nameplate,.cv-column")];
  const method = stage.querySelector(".intro-method .intro-copy"), knot = stage.querySelector(".knot-exhibit");
  const cue = stage.querySelector(".film-cue"), hint = cue.querySelector(".film-hint");
  const gauge = cue.querySelector(".film-meter i"), reader = stage.querySelector(".camera-reader");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const phone = matchMedia("(max-width:860px) and (orientation:portrait)");
  const stops = [0,.51,.95];
  const clamp = v => Math.max(0,Math.min(1,v));
  const step = (t,a,b) => {const x=clamp((t-a)/(b-a)); return x*x*(3-2*x)};
  let origin=0,travel=1,height=1,position=0,target=0,frame=0,prevTime=0,active=-1;
  function layer(node,alpha,pose) {
    node.style.opacity=alpha.toFixed(4);
    if (alpha>0) node.style.transform=pose;
  }
  function move(x,y,scale=1,roll=0) {
    return "translate3d("+x.toFixed(3)+"vw,"+y.toFixed(3)+"svh,0) rotate("+roll.toFixed(3)+"deg) scale("+scale.toFixed(4)+")";
  }
  function reading(index) {
    if (index===active) return;
    active=index;
    stage.dataset.camera=controls[index].dataset.lens;
    controls.forEach((c,i)=>c.setAttribute("aria-pressed",String(i===index)));
    acts.forEach((a,i)=>{a.inert=i!==index;a.setAttribute("aria-hidden",String(i!==index))});
    hint.textContent=index===2?"进入作品集":"向下浏览";
    reader.textContent="个人序章 · "+controls[index].textContent;
  }
  function render(p) {
    const index=p<.29?0:p<.73?1:2;
    reading(index);
    const q=reduced.matches?stops[index]:p;
    const intoCV=step(q,.08,.485), intoMethod=step(q,.56,.955);
    const branchPass=step(q,.07,.365);
    const branchAlpha=1-step(q,.218,.342);
    const faceIn=step(q,.229,.457), faceOut=step(q,.566,.755);
    const portraitAlpha=step(q,.244,.407)*(1-step(q,.60,.746));
    const knotAlpha=step(q,phone.matches ? .657 : .627,.815);
    acts[0].style.visibility=q<.434?"visible":"hidden";
    acts[1].style.visibility=q>.16&&q<.884?"visible":"hidden";
    acts[2].style.visibility=q>.595?"visible":"hidden";

    // All elements share one black field. The type travels up with the scroll;
    // the physical objects move at a different depth, already present at a cut.
    if(q<.434) {
      layer(heading,1-step(q,.085,.241),move(-7*intoCV,-14*intoCV));
      layer(branch,branchAlpha,move(-9*branchPass,-48*branchPass,1+.48*branchPass,-12*branchPass));
    }
    const lift=step(q,.037,.285);
    cord.inert=lift>.9;
    cord.style.visibility=lift>=.9999?"hidden":"visible";
    if(lift<1)cord.style.transform="translate3d(0,"+(-103*lift).toFixed(3)+"%,0)";
    if(q>.16&&q<.884) {
      layer(portrait,portraitAlpha,move(5*(1-faceIn)-(phone.matches?9:31)*faceOut,19*(1-faceIn)-(phone.matches?35:9)*faceOut,.96+.04*faceIn+.07*faceOut));
      resume.forEach((el,i)=>{
        const t=step(q,.178+i*.018,.405+i*.014);
        const u=step(q,.536+i*.009,.655+i*.007);
        layer(el,t*(1-u),move(0,14.5*(1-t)-15.5*u));
      });
    }
    if(q>.595) {
      const typed=step(q,.704,.885);
      layer(method,typed,move(0,17*(1-typed)));
      layer(knot,knotAlpha,move(19*(1-intoMethod),3*(1-intoMethod),.85+.15*intoMethod,-9*(1-intoMethod)));
    }
    gauge.style.transform="scaleX("+(.065+.935*p).toFixed(3)+")";
    stage.dataset.knotVisible=String(knotAlpha>0);
    window.dispatchEvent(new CustomEvent("film-progress",{detail:{progress:p,knotReveal:knotAlpha}}));
  }
  function animate(time) {
    frame=0;
    const dt=prevTime?Math.min(64,time-prevTime):16;
    // Damp wheel notches without modifying the scroll position or touch momentum.
    position+=(target-position)*(reduced.matches?1:1-Math.exp(-dt/73));
    const settled=Math.abs(target-position)<.00013;
    if(settled)position=target;
    render(position);
    if(settled){prevTime=0;return}
    prevTime=time;frame=requestAnimationFrame(animate);
  }
  function readScroll(snap=false) {
    const next=clamp((window.scrollY-origin)/travel);
    if(!snap&&next===target)return;
    target=next;
    if(snap||window.scrollY>=origin+travel+height||reduced.matches){
      cancelAnimationFrame(frame);frame=0;prevTime=0;position=target;render(position);return;
    }
    if(!frame)frame=requestAnimationFrame(animate);
  }
  function measure(){
    origin=reel.getBoundingClientRect().top+window.scrollY;
    height=stage.offsetHeight;travel=Math.max(1,reel.offsetHeight-height);
    readScroll(true);
  }
  function jump(i){window.scrollTo({top:origin+stops[i]*travel,behavior:reduced.matches?"instant":"smooth"})}
  controls.forEach((control,i)=>{
    control.addEventListener("click",()=>jump(i));
    control.addEventListener("keydown",e=>{
      const order={ArrowLeft:(i+2)%3,ArrowRight:(i+1)%3,Home:0,End:2};
      if(!(e.key in order))return;
      e.preventDefault();controls[order[e.key]].focus({preventScroll:true});jump(order[e.key]);
    });
  });
  cue.addEventListener("click",e=>{
    if(active===2||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    e.preventDefault();jump(active+1);
  });
  reel.classList.add("film-ready");
  measure();
  new ResizeObserver(measure).observe(reel);
  window.addEventListener("scroll",()=>readScroll(),{passive:true});
  window.addEventListener("resize",measure,{passive:true});
  window.addEventListener("pageshow",measure);
  reduced.addEventListener("change",measure);
})();
