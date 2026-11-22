(() => {
  "use strict";
  const rig = document.getElementById("badge-rig");
  if (!rig || rig.querySelector(".badge-body")) return;
  rig.innerHTML = `
    <svg class="badge-cord" aria-hidden="true"><defs>
      <path id="rig-thread"/>
      <linearGradient id="rig-metal" x1="0" y1="0" x2="1" y2=".7" gradientUnits="objectBoundingBox"><stop stop-color="#454540"/><stop offset=".2" stop-color="#efeee9"/><stop offset=".46" stop-color="#86857c"/><stop offset=".69" stop-color="#dddccf"/><stop offset="1" stop-color="#514f47"/></linearGradient>
    </defs><g fill="none" stroke-linecap="round">
      <use href="#rig-thread" stroke="#0d0d0c" stroke-width="11"/>
      <use href="#rig-thread" stroke="#73716a" stroke-width="8"/>
      <use href="#rig-thread" stroke="#242421" stroke-width="6.2"/>
      <use href="#rig-thread" stroke="#979087" stroke-width="3.6" stroke-dasharray="0.75 3.5" opacity=".75"/>
    </g><g class="badge-anchor"><rect x="-8" y="-2" width="16" height="6" rx="2" fill="#57554f" stroke="#8e8c84" stroke-width=".8"/><circle cx="-5.7" cy="1" r=".8" fill="#141413"/><circle cx="5.7" cy="1" r=".8" fill="#141413"/></g></svg>
    <div class="badge-layer"><div class="badge-mount"><div class="badge-body" role="group" tabindex="0" aria-label="何星霆的作品集简历挂牌，按空格翻面，方向键摆动">
      <i class="badge-edge" aria-hidden="true"></i><div class="badge-face badge-front">
        <div class="badge-rule"><span>作品集简历</span><time>2026</time></div>
        <div class="badge-display" lang="en">HE XINGTING</div>
        <div class="badge-mid"><div class="badge-name"><strong>何星霆</strong><small>文创设计</small><span class="badge-mark" aria-hidden="true"></span></div><img class="badge-photo" src="media/badge-portrait.webp" alt="何星霆证件照" draggable="false" width="309" height="449"></div>
        <div class="badge-school"><span>上海立达学院</span><span>视觉传达设计</span></div>
      </div>
      <div class="badge-face badge-back" inert aria-hidden="true">
        <div class="badge-rule"><span>何星霆 / 个人简历</span><time>2026</time></div>
        <strong>设计工具</strong><span class="badge-tools" lang="en">Photoshop<br>Illustrator<br>Midjourney · Stable Diffusion</span>
        <a class="badge-mail" href="mailto:2100391483@qq.com">2100391483@qq.com</a>
        <a class="badge-download" href="media/profile.pdf" download="何星霆_个人简介.pdf">下载简历 · PDF</a>
      </div>
    </div></div></div>
    <svg class="badge-hardware" aria-hidden="true"><g class="badge-clip" fill="none" stroke-linejoin="round" stroke-linecap="round">
      <g stroke="#171713" stroke-width="5.25"><ellipse cy="-32" rx="4.5" ry="5.5"/><path d="M0-27v5c0 3 5 3 5 6L3-1Q2 3-1 2l-2-1"/></g>
      <g stroke="url(#rig-metal)" stroke-width="3.35"><ellipse cy="-32" rx="4.5" ry="5.5"/><path d="M0-27v5c0 3 5 3 5 6L3-1Q2 3-1 2l-2-1"/></g>
      <path d="M-1-21q-5 1-4 7l1 9" stroke="#b2b0a7" stroke-width="1.7"/>
      <path d="M-4-16q-1-2 0-3M4-14 3-5" stroke="#eeebe1" stroke-width="1"/>
      <rect x="-3" y="-27" width="6" height="4.5" rx="1.4" fill="url(#rig-metal)"/>
    </g></svg>
    <button type="button" class="badge-control" aria-pressed="false" aria-label="翻到挂牌背面">拖动挂牌 · 点击翻面</button>`;

  const body = rig.querySelector(".badge-body");
  const mount = rig.querySelector(".badge-mount");
  const cord = rig.querySelector("#rig-thread");
  const clip = rig.querySelector(".badge-clip");
  const socket = rig.querySelector(".badge-anchor");
  const front = rig.querySelector(".badge-front");
  const back = rig.querySelector(".badge-back");
  const control = rig.querySelector(".badge-control");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const state = {x:0, y:0, angle:-6, yaw:0, vx:0, vy:0, va:0, vz:0};
  let halfTurn=0, anchor=0, rest=0, maxSwing=0, drag=null, visible=true, frame=0, last=0, didEnter=false;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const restYaw=()=>halfTurn*180-6;

  function measure() {
    const w=rig.clientWidth,h=rig.clientHeight,bh=body.offsetHeight,bw=body.offsetWidth;
    anchor=w/2;
    socket.setAttribute("transform","translate(" + (anchor-8) + " 0)");
    rest=Math.max(42,Math.min(300,h*.43,h-bh-47));
    maxSwing=Math.max(28,Math.min((w-bw)*.53,rest*.9));
    rig.style.setProperty("--badge-label-top", Math.round(rest+bh+7)+"px");
    rig.querySelectorAll(".badge-cord,.badge-hardware").forEach(svg=>svg.setAttribute("viewBox","0 0 "+w+" "+h));
    if(!didEnter && w>0 && h>0) {
      didEnter=true;
      if(!reduced.matches) Object.assign(state,{x:-maxSwing*.65,y:-21,angle:19,yaw:-60,vx:96,vz:84});
    }
    paint();wake();
  }
  function paint() {
    const x=anchor+state.x, y=rest+state.y;
    const angle=state.angle*Math.PI/180;
    const endX=x+32*Math.sin(angle),endY=y-32*Math.cos(angle);
    const startX=anchor-8,drop=Math.max(0,endY+4);
    const slack=Math.max(0,-state.y-Math.abs(state.x)*.16);
    const c1=startX+(endX-startX)*.23-slack*.5, c2=endX-(endX-startX)*.26-state.vx*.012;
    cord.setAttribute("d",`M${startX} -5 C${c1} ${drop*.32},${c2} ${endY-drop*.26},${endX} ${endY}`);
    mount.style.transform=`translate3d(${x}px,${y}px,0)`;
    body.style.transform=`rotateZ(${state.angle}deg) rotateY(${state.yaw}deg)`;
    body.style.setProperty("--glaze",(Math.sin(state.yaw*Math.PI/180)*22).toFixed(2)+"%");
    clip.setAttribute("transform",`translate(${x} ${y}) rotate(${state.angle})`);
  }
  function wake(){if(!frame && visible && !document.hidden)frame=requestAnimationFrame(tick)}
  function tick(now){
    frame=0;
    const dt=last?Math.min(.025,Math.max(.001,(now-last)/1000)):1/60;last=now;
    const targetX=drag?drag.tx:0;
    const targetY=drag?drag.ty:Math.sqrt(Math.max(0,rest*rest-state.x*state.x))-rest;
    const targetAngle=-6-state.x/Math.max(60,rest)*43-state.vx*.044;
    const targetYaw=drag?drag.yaw:restYaw();
    const motions=[["x","vx",targetX,drag?230:52,drag?23:6.7],["y","vy",targetY,drag?230:83,drag?23:9],
      ["angle","va",targetAngle,64,8.6],["yaw","vz",targetYaw,drag?155:65,drag?19:9.7]];
    let settled=true;
    for(const [pos,vel,target,k,damping] of motions){
      if(reduced.matches){state[pos]=pos==="angle"?-5:target;state[vel]=0;continue}
      state[vel]+=(k*(target-state[pos])-damping*state[vel])*dt;
      state[pos]+=state[vel]*dt;
      if(Math.abs(target-state[pos])>.07 || Math.abs(state[vel])>.7)settled=false;
    }
    if(settled && !drag) {
      Object.assign(state,{x:0,y:0,angle:-6,yaw:restYaw(),vx:0,vy:0,va:0,vz:0});
      last=0;
    }
    paint();
    if(!settled)wake();
  }
  function exposeSide(){
    const isBack=Math.abs(halfTurn%2)===1;
    front.inert=isBack;back.inert=!isBack;
    front.setAttribute("aria-hidden",String(isBack));back.setAttribute("aria-hidden",String(!isBack));
    control.setAttribute("aria-pressed",String(isBack));
    control.setAttribute("aria-label",isBack?"翻回挂牌正面":"翻到挂牌背面");
    control.textContent=isBack?"翻回正面":"拖动挂牌 · 点击翻面";
  }
  function flip(direction=1){
    halfTurn+=direction;exposeSide();wake();
  }
  control.addEventListener("click",()=>flip());
  body.addEventListener("keydown",e=>{
    if(e.target!==body)return;
    if(e.key===" " || e.key==="Enter"){e.preventDefault();flip();return}
    if(e.key==="ArrowLeft" || e.key==="ArrowRight"){
      e.preventDefault();const direction=e.key==="ArrowLeft"?-1:1;
      if(reduced.matches)flip(direction);
      else {state.vx=direction*260;state.vz=direction*260;wake()}
    }
  });
  body.addEventListener("pointerdown",e=>{
    if(drag || e.button!==0 || e.target.closest("a,button"))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:state.x,oy:state.y,tx:state.x,ty:state.y,
      baseYaw:restYaw(),yaw:state.yaw,dx:0,dy:0,lastX:e.clientX,time:e.timeStamp,throwV:0,moved:false};
    body.classList.add("is-grabbed");body.setPointerCapture(e.pointerId);
    body.focus({preventScroll:true});wake();
  });
  body.addEventListener("pointermove",e=>{
    if(!drag || e.pointerId!==drag.id)return;
    drag.dx=e.clientX-drag.x;drag.dy=e.clientY-drag.y;
    if(Math.hypot(drag.dx,drag.dy)>5)drag.moved=true;
    drag.tx=clamp(drag.ox+drag.dx,-maxSwing,maxSwing);
    const taut=Math.sqrt(Math.max(0,rest*rest-drag.tx*drag.tx))-rest;
    drag.ty=clamp(drag.oy+drag.dy,-rest*.64,taut+12);
    const ms=Math.max(8,e.timeStamp-drag.time);
    drag.throwV=clamp((e.clientX-drag.lastX)*1000/ms,-950,950);
    drag.lastX=e.clientX;drag.time=e.timeStamp;
    drag.yaw=drag.baseYaw+clamp(drag.dx*1.6,-185,185);
    wake();
  });
  function release(e,cancelled){
    if(!drag || e.pointerId!==drag.id)return;
    const old=drag;drag=null;body.classList.remove("is-grabbed");
    if(body.hasPointerCapture(e.pointerId))body.releasePointerCapture(e.pointerId);
    if(!cancelled && !old.moved)flip();
    else if(!cancelled){
      const v=e.timeStamp-old.time<115?old.throwV:0;
      state.vx=clamp(v*.44,-500,500);state.vz=clamp(v*.46,-520,520);
      if(Math.abs(old.dx)>58 || Math.abs(v)>450)flip(Math.sign(old.dx || v));
    }
    wake();
  }
  body.addEventListener("pointerup",e=>release(e,false));
  body.addEventListener("pointercancel",e=>release(e,true));
  body.addEventListener("lostpointercapture",e=>release(e,true));
  function pause(){cancelAnimationFrame(frame);frame=0;last=0}
  if("IntersectionObserver" in window)new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;if(visible)wake();else pause();
  }).observe(rig);
  document.addEventListener("visibilitychange",()=>document.hidden?pause():wake());
  reduced.addEventListener("change",wake);
  new ResizeObserver(measure).observe(rig);
  measure();
})();
