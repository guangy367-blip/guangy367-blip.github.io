(() => {
  "use strict";
  const rig = document.getElementById("badge-rig");
  if (!rig || rig.querySelector(".badge-body")) return;
  rig.innerHTML = `
    <svg class="badge-cord" aria-hidden="true"><defs>
      <path id="rig-thread"/>
      <linearGradient id="rig-metal" x1="0" y1="0" x2="1" y2=".7" gradientUnits="objectBoundingBox"><stop stop-color="#454540"/><stop offset=".2" stop-color="#efeee9"/><stop offset=".46" stop-color="#86857c"/><stop offset=".69" stop-color="#dddccf"/><stop offset="1" stop-color="#514f47"/></linearGradient>
    </defs><g fill="none" stroke-linecap="round">
      <use href="#rig-thread" stroke="#050505" stroke-width="11" opacity=".32" transform="translate(3 3)"/>
      <use href="#rig-thread" stroke="#0d0d0c" stroke-width="11"/>
      <use href="#rig-thread" stroke="#73716a" stroke-width="8"/>
      <use href="#rig-thread" stroke="#242421" stroke-width="6.2"/>
      <use href="#rig-thread" stroke="#979087" stroke-width="3.6" stroke-dasharray="0.75 3.5" opacity=".75"/>
    </g><g class="badge-anchor"><rect x="-8" y="-2" width="16" height="6" rx="2" fill="#57554f" stroke="#8e8c84" stroke-width=".8"/><circle cx="-5.7" cy="1" r=".8" fill="#141413"/><circle cx="5.7" cy="1" r=".8" fill="#141413"/></g></svg>
    <div class="badge-layer"><div class="badge-mount"><div class="badge-body" role="group" tabindex="0" aria-label="何星霆的求职挂牌，正面个人简介，背面服务客户。按空格翻面，方向键甩动">
      <i class="badge-edge" aria-hidden="true"></i><div class="badge-face badge-front">
        <div class="badge-rule"><span>作品集简历</span><time>2026</time></div>
        <div class="badge-display" lang="en">HE XINGTING</div>
        <div class="badge-mid"><div class="badge-name"><strong>何星霆</strong><small>文创设计</small><span class="badge-mark" aria-hidden="true"></span></div><img class="badge-photo" src="media/badge-portrait.webp" alt="何星霆证件照" draggable="false" width="309" height="449"></div>
        <div class="badge-school"><span>上海立达学院</span><span>视觉传达设计</span></div>
      </div>
      <div class="badge-face badge-back" inert aria-hidden="true">
        <div class="badge-rule"><span>何星霆</span><time>2026</time></div>
        <h2 class="badge-back-heading">服务客户<small lang="en">selected clients</small></h2>
        <ul class="badge-clients">
          <li><span>南京琉璃兽餐饮管理<wbr><span class="badge-legal-tail">有限责任公司</span></span></li>
          <li>重庆桤友良品科技有限公司</li>
          <li>北京瑰辰科技有限公司</li>
          <li>济南绿城育华杨柳春风学校</li>
          <li>怡高安迪（香港）有限公司</li>
        </ul>
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
  const state = {x:0, y:0, angle:-6, pitch:0, yaw:-6, vx:0, vy:0, va:0, vp:0, vz:0};
  // The fixed socket and the moving snap hook constrain the two ends of
  // a chain of short, inextensible spans. Interior knots retain momentum.
  const knots=Array.from({length:12},()=>({x:0,y:0,px:0,py:0}));
  let halfTurn=0,anchor=0,rest=0,leftReach=0,rightReach=0,strandLength=0;
  let drag=null,visible=true,frame=0,last=0,didEnter=false,resetCord=true,lastTap=-1000;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const restYaw=()=>halfTurn*180-6;

  function measure() {
    const w=rig.clientWidth,h=rig.clientHeight,bh=body.offsetHeight,bw=body.offsetWidth;
    anchor=w/2;
    socket.setAttribute("transform","translate(" + (anchor-8) + " 0)");
    rest=Math.max(42,Math.min(300,h*.43,h-bh-47));
    const centre=rig.getBoundingClientRect().left+anchor;
    leftReach=Math.max(22,Math.min(rest*.96,centre-bw*.52-8));
    rightReach=Math.max(22,Math.min(rest*.96,innerWidth-centre-bw*.52-8));
    strandLength=Math.hypot(8+32*Math.sin(-6*Math.PI/180),rest-32*Math.cos(-6*Math.PI/180)+5)*1.006;
    resetCord=true;
    rig.style.setProperty("--badge-label-top", Math.round(rest+bh+7)+"px");
    rig.querySelectorAll(".badge-cord,.badge-hardware").forEach(svg=>svg.setAttribute("viewBox","0 0 "+w+" "+h));
    if(!didEnter && w>0 && h>0) {
      didEnter=true;
      if(!reduced.matches) Object.assign(state,{
        x:-Math.min(leftReach*.65,95),y:-Math.min(rest*.62,176),
        angle:23,pitch:-32,yaw:-72,vx:125,vy:180,vp:80,vz:116
      });
    }
    paint(0);wake();
  }
  function stepRope(sx,sy,ex,ey,dt){
    const n=knots.length-1,dx=ex-sx,dy=ey-sy,distance=Math.hypot(dx,dy);
    const span=Math.max(distance,strandLength)/n;
    const spare=Math.max(0,strandLength-distance);
    if(resetCord || reduced.matches){
      knots.forEach((p,i)=>{
        const t=i/n, bow=Math.sin(t*Math.PI)*Math.sqrt(spare*strandLength)*.26;
        p.x=p.px=sx+dx*t-bow;p.y=p.py=sy+dy*t;
      });
      resetCord=false;
    }
    const start=knots[0],end=knots[n];
    start.x=sx;start.y=sy;end.x=ex;end.y=ey;
    let energy=0;
    if(dt && !reduced.matches){
      const damp=Math.exp(-4.7*dt),gravity=1250*dt*dt;
      for(let i=1;i<n;i++){
        const p=knots[i],vx=(p.x-p.px)*damp,vy=(p.y-p.py)*damp;
        p.px=p.x;p.py=p.y;
        p.x+=clamp(vx,-20,20)-Math.min(220,spare*3)*dt*dt*Math.sin(i/n*Math.PI);
        p.y+=clamp(vy,-20,20)+gravity;
      }
      // Alternate solve order so an upward pull can create slack near the
      // hand without making the fixed end appear to pull out of its socket.
      for(let pass=0;pass<8;pass++){
        for(let k=0;k<n;k++){
          const j=pass%2?n-k-1:k,a=knots[j],b=knots[j+1];
          const x=b.x-a.x,y=b.y-a.y,len=Math.hypot(x,y);
          if(len<.0001)continue;
          const strain=(len-span)/len,wa=j===0?0:j===n-1?1:.5,wb=1-wa;
          a.x+=x*strain*wa;a.y+=y*strain*wa;b.x-=x*strain*wb;b.y-=y*strain*wb;
        }
      }
      for(let i=1;i<n;i++)energy=Math.max(energy,Math.hypot(knots[i].x-knots[i].px,knots[i].y-knots[i].py));
    }
    let path="M"+sx.toFixed(2)+" "+sy;
    for(let i=1;i<n;i++){
      const a=knots[i],b=knots[i+1];
      path+=" Q"+a.x.toFixed(2)+" "+a.y.toFixed(2)+" "+((a.x+b.x)/2).toFixed(2)+" "+((a.y+b.y)/2).toFixed(2);
    }
    cord.setAttribute("d",path+" L"+ex.toFixed(2)+" "+ey.toFixed(2));
    return energy;
  }
  function paint(dt) {
    const x=anchor+state.x, y=rest+state.y;
    const angle=state.angle*Math.PI/180;
    const endX=x+32*Math.sin(angle),endY=y-32*Math.cos(angle);
    const energy=stepRope(anchor-8,-5,endX,endY,dt);
    mount.style.transform=`translate3d(${x}px,${y}px,0)`;
    body.style.transform=`rotateZ(${state.angle}deg) rotateY(${state.yaw}deg) rotateX(${state.pitch}deg)`;
    body.style.setProperty("--glaze",(Math.sin(state.yaw*Math.PI/180)*22+state.pitch*.18).toFixed(2)+"%");
    clip.setAttribute("transform",`translate(${x} ${y}) rotate(${state.angle})`);
    return energy;
  }
  function wake(){if(!frame && visible && !document.hidden)frame=requestAnimationFrame(tick)}
  function tick(now){
    frame=0;
    const dt=last?Math.min(.025,Math.max(.001,(now-last)/1000)):1/60;last=now;
    const targetX=drag?drag.tx:0;
    const targetY=drag?drag.ty:Math.sqrt(Math.max(0,rest*rest-state.x*state.x))-rest;
    const targetAngle=-6-Math.atan2(state.x,Math.max(38,rest+state.y))*46-state.vx*.05+(drag?drag.grip*drag.dy*.11:0);
    const targetPitch=drag?drag.pitch:clamp(-state.vy*.054+state.vx*.019,-30,30);
    const targetYaw=drag?drag.yaw:restYaw();
    const motions=[["x","vx",targetX,drag?930:51,drag?53:4.5],["y","vy",targetY,drag?930:82,drag?53:6.8],
      ["angle","va",clamp(targetAngle,-55,55),85,8.8],["pitch","vp",targetPitch,drag?210:78,drag?21:7],
      ["yaw","vz",targetYaw,drag?235:64,drag?22:9.3]];
    let settled=true;
    for(const [pos,vel,target,k,damping] of motions){
      if(reduced.matches){state[pos]=pos==="angle"?-6:pos==="pitch"?0:target;state[vel]=0;continue}
      state[vel]+=(k*(target-state[pos])-damping*state[vel])*dt;
      state[pos]+=state[vel]*dt;
      if(Math.abs(target-state[pos])>.07 || Math.abs(state[vel])>.7)settled=false;
    }
    if(settled && !drag) {
      Object.assign(state,{x:0,y:0,angle:-6,pitch:0,yaw:restYaw(),vx:0,vy:0,va:0,vp:0,vz:0});
    }
    const ropeMotion=paint(dt);
    if(!settled || ropeMotion>.12)wake();else last=0;
  }
  function exposeSide(){
    const isBack=Math.abs(halfTurn%2)===1;
    front.inert=isBack;back.inert=!isBack;
    front.setAttribute("aria-hidden",String(isBack));back.setAttribute("aria-hidden",String(!isBack));
    control.setAttribute("aria-pressed",String(isBack));
    control.setAttribute("aria-label",isBack?"翻回挂牌正面":"翻到挂牌背面，查看服务客户");
    control.textContent=isBack?"翻回正面":"拖动挂牌 · 点击翻面";
  }
  function flip(direction=1){
    halfTurn+=direction;
    if(!reduced.matches){state.vp+=Math.sign(direction)*85;state.va+=Math.sign(direction)*36}
    exposeSide();wake();
  }
  control.addEventListener("click",e=>{if(e.detail<2)flip()});
  body.addEventListener("keydown",e=>{
    if(e.target!==body)return;
    if(e.key===" " || e.key==="Enter"){e.preventDefault();flip();return}
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
      e.preventDefault();const direction=["ArrowLeft","ArrowUp"].includes(e.key)?-1:1;
      if(reduced.matches)flip(direction);
      else if(["ArrowLeft","ArrowRight"].includes(e.key)){state.vx=direction*390;state.vz=direction*310;wake()}
      else{state.vy=direction*310;state.vp=direction*245;wake()}
    }
  });
  body.addEventListener("pointerdown",e=>{
    if(drag || e.button!==0 || e.target.closest("a,button"))return;
    const box=body.getBoundingClientRect();
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,ox:state.x,oy:state.y,tx:state.x,ty:state.y,
      baseYaw:state.yaw,yaw:state.yaw,pitch:state.pitch,grip:clamp((e.clientX-box.left)/Math.max(box.width,1)*2-1,-1,1),
      dx:0,dy:0,lastX:e.clientX,lastY:e.clientY,time:e.timeStamp,vx:0,vy:0,moved:false};
    body.classList.add("is-grabbed");body.setPointerCapture(e.pointerId);
    body.focus({preventScroll:true});wake();
  });
  body.addEventListener("pointermove",e=>{
    if(!drag || e.pointerId!==drag.id)return;
    drag.dx=e.clientX-drag.x;drag.dy=e.clientY-drag.y;
    if(Math.hypot(drag.dx,drag.dy)>5)drag.moved=true;
    drag.tx=clamp(drag.ox+drag.dx,-leftReach,rightReach);
    const taut=Math.sqrt(Math.max(0,rest*rest-drag.tx*drag.tx))-rest;
    drag.ty=clamp(drag.oy+drag.dy,-Math.min(rest*.72,rest-37),taut+15);
    const ms=Math.max(8,e.timeStamp-drag.time);
    drag.vx=drag.vx*.3+.7*clamp((e.clientX-drag.lastX)*1000/ms,-1600,1600);
    drag.vy=drag.vy*.3+.7*clamp((e.clientY-drag.lastY)*1000/ms,-1100,1100);
    drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=e.timeStamp;
    drag.yaw=drag.baseYaw+clamp(drag.dx*(1.08+.25*Math.abs(drag.grip)),-200,200);
    drag.pitch=clamp(-drag.dy*.47+drag.grip*drag.dx*.095,-54,54);
    wake();
  });
  function release(e,cancelled){
    if(!drag || e.pointerId!==drag.id)return;
    const old=drag;drag=null;body.classList.remove("is-grabbed");
    if(body.hasPointerCapture(e.pointerId))body.releasePointerCapture(e.pointerId);
    if(!cancelled && !old.moved){
      // A double tap is a single turn, rather than two cancelling half turns.
      if(e.timeStamp-lastTap>340)flip();
      lastTap=e.timeStamp;
    }
    else if(!cancelled){
      const carry=e.timeStamp-old.time<130?1:0;
      const v=old.vx*carry;
      state.vx=clamp(v*.59,-680,680);state.vy=clamp(old.vy*carry*.48,-380,380);
      state.vz=clamp(v*.72,-900,900);state.vp=clamp(-old.vy*carry*.38,-340,340);
      if(Math.abs(old.dx)>58 || Math.abs(v)>420) {
        const travel=old.yaw-restYaw()+v*.22;
        const turns=clamp(Math.round(travel/180),-3,3) || Math.sign(old.dx || v);
        flip(turns);
      }
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
