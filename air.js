(() => {
  "use strict";
  const top=document.querySelector("#top");
  if(!top)return;
  const nav=top.querySelector(".cover-nav"),footer=document.querySelector("body > footer");
  if(nav && footer && "IntersectionObserver" in window){
    const inView=new Map([[nav,true],[footer,false]]);
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>inView.set(entry.target,entry.isIntersecting));
      document.body.classList.toggle("music-away",!inView.get(nav)&&!inView.get(footer));
    });
    observer.observe(nav);
    observer.observe(footer);
  }
  const track=top.querySelector(".cover-track"),handle=track?.querySelector(".branch-touch");
  if(!handle)return;
  const reduced=matchMedia("(prefers-reduced-motion:reduce)");
  const state={x:0,y:0,a:0,vx:0,vy:0,va:0},target={x:0,y:0,a:0};
  const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  const heldKeys=new Set();
  let drag=null,frame=0,lastTime=0,limitX=120,limitY=80;

  function bounds(){
    limitX=Math.max(38,Math.min(175,track.offsetWidth*.26));
    limitY=Math.max(32,Math.min(114,track.offsetHeight*.47));
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
  function render(){
    track.style.setProperty("--wood-x",state.x.toFixed(2)+"px");
    track.style.setProperty("--wood-y",state.y.toFixed(2)+"px");
    track.style.setProperty("--wood-roll",state.a.toFixed(2)+"deg");
  }
  function wake(){
    if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function tick(time){
    frame=0;
    const dt=lastTime?clamp((time-lastTime)/1000,.001,.032):1/60;
    lastTime=time;
    if(heldKeys.size){
      for(const key of heldKeys){
        const [dx,dy]=arrows[key]||[0,0];
        target.x=clamp(target.x+dx*180*dt,-limitX,limitX);
        target.y=clamp(target.y+dy*160*dt,-limitY,limitY);
      }
      target.a=clamp(target.x*.052-target.y*.023,-9,9);
    }
    const grasped=drag?.caught||heldKeys.size>0;
    const k=grasped?730:96,damp=grasped?43:14;
    let moving=false;
    for(const axis of ["x","y","a"]){
      const velocity="v"+axis,delta=target[axis]-state[axis];
      if(reduced.matches){state[axis]=axis==="a"?0:target[axis];state[velocity]=0}
      else{
        state[velocity]+=(k*delta-damp*state[velocity])*dt;
        state[axis]+=state[velocity]*dt;
        if(Math.abs(delta)>.08 || Math.abs(state[velocity])>.75)moving=true;
      }
    }
    if(!moving&&!grasped)Object.assign(state,{x:0,y:0,a:0,vx:0,vy:0,va:0});
    render();
    if(moving||heldKeys.size)wake();
    else lastTime=0;
  }
  function release(){
    const id=drag?.id;
    drag=null;
    heldKeys.clear();
    delete handle.dataset.grabbed;
    Object.assign(target,{x:0,y:0,a:0});
    if(id!==undefined&&handle.hasPointerCapture(id))handle.releasePointerCapture(id);
    wake();
  }
  function immobilize(){
    release();
    cancelAnimationFrame(frame);
    frame=lastTime=0;
    Object.assign(state,{x:0,y:0,a:0,vx:0,vy:0,va:0});
    render();
  }
  handle.addEventListener("pointerdown",event=>{
    if(!event.isPrimary||event.button!==0||drag)return;
    bounds();
    heldKeys.clear();
    const rect=track.getBoundingClientRect();
    const matrix=new DOMMatrixReadOnly(getComputedStyle(track).transform==="none"?undefined:getComputedStyle(track).transform);
    const inverse=matrix.inverse();
    drag={id:event.pointerId,type:event.pointerType,x:event.clientX,y:event.clientY,
      ox:state.x,oy:state.y,grip:clamp((event.clientX-rect.left)/rect.width-.5,-.5,.5),
      ax:inverse.a,bx:inverse.c,ay:inverse.b,by:inverse.d,caught:event.pointerType==="mouse"};
    Object.assign(target,{x:state.x,y:state.y,a:state.a});
    if(drag.caught){
      handle.dataset.grabbed="";
      handle.setPointerCapture(event.pointerId);
      handle.focus({preventScroll:true});
    }
  });
  handle.addEventListener("pointermove",event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.caught){
      if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
      if(Math.abs(dy)>=Math.abs(dx)*.9){release();return}
      drag.caught=true;
      handle.dataset.grabbed="";
      handle.setPointerCapture(event.pointerId);
    }
    const localX=drag.ax*dx+drag.bx*dy,localY=drag.ay*dx+drag.by*dy;
    target.x=clamp(drag.ox+localX,-limitX,limitX);
    target.y=clamp(drag.oy+localY,-limitY,limitY);
    target.a=clamp(localX*.047+localY*drag.grip*.17,-12,12);
    wake();
  });
  for(const name of ["pointerup","pointercancel","lostpointercapture"]){
    handle.addEventListener(name,event=>{if(drag?.id===event.pointerId)release()});
  }
  handle.addEventListener("keydown",event=>{
    if(event.key==="Escape"){release();return}
    if(event.altKey||event.ctrlKey||event.metaKey||drag)return;
    if(!(event.key in arrows)&&event.key!==" "&&event.key!=="Enter")return;
    event.preventDefault();
    if(heldKeys.has(event.key))return;
    bounds();
    heldKeys.add(event.key);
    const [dx,dy]=arrows[event.key]||[0,-1];
    target.x=clamp(target.x+dx*22,-limitX,limitX);
    target.y=clamp(target.y+dy*18,-limitY,limitY);
    handle.dataset.grabbed="";
    wake();
  });
  handle.addEventListener("keyup",event=>{
    if(!heldKeys.delete(event.key))return;
    event.preventDefault();
    if(!heldKeys.size)release();
  });
  handle.addEventListener("blur",()=>{if(heldKeys.size)release()});
  window.addEventListener("blur",release);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)immobilize()});
  window.addEventListener("film-progress",()=>{
    if(top.dataset.camera!=="whole" && (frame||drag||heldKeys.size))immobilize();
  });
  reduced.addEventListener("change",immobilize);
})();
