(() => {
  "use strict";
  const root=document.getElementById("play-studio");
  if (!root || root.querySelector(".mp-installation")) return;
  const poses=[
    {id:"prone",label:"趴卧猴",width:27,anchor:[.44,.80]},
    {id:"peeker",label:"探头猴",width:10,anchor:[.88,.24]},
    {id:"hanger",label:"悬挂猴",width:12,anchor:[.50,.025]},
    {id:"inverted",label:"倒挂猴",width:17,anchor:[.51,.015]},
    {id:"reach",label:"伸手猴",width:25,anchor:[.04,.17]}
  ];
  const sockets=[
    {name:"山顶",x:.54,y:.035}, {name:"左侧崖口",x:.204,y:.29},
    {name:"右上洞口",x:.744,y:.227}, {name:"中层石窝",x:.347,y:.514},
    {name:"右下岩面",x:.688,y:.723}, {name:"高处石眼",x:.391,y:.145},
    {name:"山腰右缘",x:.86,y:.55}
  ];
  const start=[0,1,-1,-1,-1];
  let placed=start.slice(), selected=2, nearest=-1, moving=null, suppressClick=0;
  const poseImage=p=>"media/play-"+p.id+".webp";
  root.setAttribute("aria-labelledby","play-title");
  root.innerHTML=`<header class="mp-head"><div><div class="eyebrow"><i></i> INTERACTIVE OBJECT</div><h2 id="play-title">猴山<span>磁吸互动</span></h2></div><a href="case.html?p=monkey">查看项目 <span aria-hidden="true">↗</span></a></header>
  <div class="mp-installation"><div class="mp-stage" aria-label="太湖石磁吸摆件">
    <div class="mp-stone"><img class="mp-rock" src="media/play-rock-front.webp" width="1050" height="1023" loading="lazy" decoding="async" alt="七处可吸附位置的太湖石造型山体" draggable="false">
      <div class="mp-pieces"></div><div class="mp-sockets"></div><img class="mp-ghost" alt="" draggable="false" hidden></div>
  </div><aside class="mp-bench"><div class="mp-bench-top"><h3>五种猴姿</h3><span class="mp-count"></span></div><p class="mp-instructions">选一只灵猴，拖到山石上的圆点。也可以依次点选猴子和位置。</p>
    <div class="mp-tray" role="group" aria-label="选择灵猴"></div>
    <div class="mp-tools"><button type="button" class="mp-remove">取下灵猴</button><button type="button" class="mp-reset">还原</button></div><p class="mp-announcement" role="status" aria-live="polite" aria-atomic="true"></p>
  </aside></div>`;
  const $=s=>root.querySelector(s);
  const stone=$(".mp-stone"), pieces=$(".mp-pieces"), tray=$(".mp-tray"), ghost=$(".mp-ghost"),status=$(".mp-announcement");
  const thumbButtons=[],piecesOnStone=[],ports=[];
  const button=(className,label)=>{const b=document.createElement("button");b.type="button";b.className=className;b.setAttribute("aria-label",label);return b};
  function geometry(el,p,x,y) {
    el.style.left=x*100+"%";el.style.top=y*100+"%";el.style.width=p.width+"%";
    el.style.transform="translate("+(-p.anchor[0]*100)+"%,"+(-p.anchor[1]*100)+"%)";
  }
  function canPlace(index){ return !placed.includes(index); }
  function render() {
    poses.forEach((p,i)=>{
      const s=sockets[placed[i]],tile=thumbButtons[i],figure=piecesOnStone[i];
      tile.setAttribute("aria-pressed",String(i===selected));
      tile.classList.toggle("mp-on",!!s);
      tile.setAttribute("aria-label",p.label+(s?"，已放在"+s.name:"，待放置"));
      figure.hidden=!s;
      if(s){geometry(figure,p,s.x,s.y);figure.setAttribute("aria-label",s.name+"的"+p.label+"，选择并移动")}
    });
    ports.forEach((b,i)=>{b.hidden=!canPlace(i);b.title="吸附到"+sockets[i].name;b.setAttribute("aria-label","把"+poses[selected].label+"吸附到"+sockets[i].name)});
    const count=placed.filter(i=>i!==-1).length;
    $(".mp-count").textContent=count+" / 5 已吸附";
    $(".mp-remove").disabled=placed[selected]===-1;
    $(".mp-reset").disabled=placed.every((s,i)=>s===start[i]);
    root.classList.toggle("mp-complete",count===poses.length);
  }
  function choose(i,announce=true){
    selected=i;render();
    if(announce)status.textContent="已选"+poses[i].label+"，请选择新的吸附点。";
  }
  function place(slot){
    if(!canPlace(slot))return;
    placed[selected]=slot;render();
    const count=placed.filter(i=>i>=0).length;
    status.textContent=count===poses.length?"五猴齐聚。还可以继续换位。":poses[selected].label+"已吸附在"+sockets[slot].name+"。";
    const image=piecesOnStone[selected].firstChild;
    if(!matchMedia("(prefers-reduced-motion: reduce)").matches && image.animate)
      image.animate([{transform:"scale(1.1) rotate(-4deg)"},{transform:"scale(.97) rotate(1deg)",offset:.68},{transform:"none"}],{duration:240,easing:"ease-out"});
  }
  function point(event) {
    const bounds=stone.getBoundingClientRect();
    const x=(event.clientX-bounds.left)/bounds.width,y=(event.clientY-bounds.top)/bounds.height;
    let min=Math.max(34,Math.min(bounds.width*.16,83)), index=-1;
    sockets.forEach((socket,i)=>{
      if(!canPlace(i))return;
      const d=Math.hypot((x-socket.x)*bounds.width,(y-socket.y)*bounds.height);
      if(d<min){min=d;index=i}
    });
    if(nearest!==index){ports[nearest]?.classList.remove("mp-magnet");ports[index]?.classList.add("mp-magnet");nearest=index}
    const socket=sockets[index];
    geometry(ghost,poses[selected],socket?x+(socket.x-x)*.55:x,socket?y+(socket.y-y)*.55:y);
    ghost.hidden=x<-.14||x>1.14||y<-.16||y>1.15;
  }
  function end(event,cancelled) {
    if(!moving || event.pointerId!==moving.pointer)return;
    const last=moving;moving=null;
    if(last.active){
      if(!cancelled)point(event);
      if(!cancelled&&nearest>=0)place(nearest);
      else if(!cancelled)status.textContent="将灵猴放在亮起的圆点即可吸附。";
      suppressClick=performance.now()+350;
    }
    piecesOnStone[last.i].classList.remove("mp-in-hand");root.classList.remove("mp-dragging");ghost.hidden=true;
    ports[nearest]?.classList.remove("mp-magnet");nearest=-1;
    if(last.el.hasPointerCapture(event.pointerId))last.el.releasePointerCapture(event.pointerId);
  }
  function bindDrag(el,i) {
    el.addEventListener("pointerdown",e=>{
      if(moving || !e.isPrimary || e.button!==0)return;
      moving={pointer:e.pointerId,el,i,x:e.clientX,y:e.clientY,active:false};
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove",e=>{
      if(!moving||moving.pointer!==e.pointerId||moving.el!==el)return;
      if(!moving.active){
        if(Math.hypot(e.clientX-moving.x,e.clientY-moving.y)<6)return;
        moving.active=true;choose(i,false);ghost.src=poseImage(poses[i]);
        piecesOnStone[i].classList.add("mp-in-hand");root.classList.add("mp-dragging");
      }
      point(e);
    });
    el.addEventListener("pointerup",e=>end(e,false));el.addEventListener("pointercancel",e=>end(e,true));
    el.addEventListener("lostpointercapture",e=>end(e,true));
    el.addEventListener("click",e=>{
      if(e.detail && performance.now()<suppressClick)return;
      choose(i);
      if(!e.detail) ports.find(b=>!b.hidden)?.focus({preventScroll:true});
    });
  }
  poses.forEach((p,i)=>{
    const tile=button("mp-pose",p.label),figure=button("mp-figure",p.label);
    const figureImg=document.createElement("img");figureImg.alt="";figureImg.loading="lazy";figureImg.decoding="async";figureImg.draggable=false;figureImg.src=poseImage(p);
    const thumb=figureImg.cloneNode();tile.append(thumb,document.createTextNode(p.label));figure.append(figureImg);
    thumbButtons.push(tile);piecesOnStone.push(figure);tray.append(tile);pieces.append(figure);bindDrag(tile,i);bindDrag(figure,i);
  });
  sockets.forEach((s,i)=>{
    const b=button("mp-port",s.name);b.style.left=s.x*100+"%";b.style.top=s.y*100+"%";
    b.addEventListener("click",e=>{place(i);if(!e.detail)thumbButtons[selected].focus({preventScroll:true})});
    b.addEventListener("keydown",e=>{
      if(!["ArrowLeft","ArrowUp","ArrowDown","ArrowRight"].includes(e.key))return;
      e.preventDefault();const open=ports.filter(el=>!el.hidden),d=["ArrowLeft","ArrowUp"].includes(e.key)?-1:1;
      open[(open.indexOf(b)+d+open.length)%open.length].focus();
    });
    ports.push(b);$(".mp-sockets").append(b);
  });
  $(".mp-remove").addEventListener("click",()=>{placed[selected]=-1;render();status.textContent="已取下"+poses[selected].label+"。";thumbButtons[selected].focus({preventScroll:true})});
  $(".mp-reset").addEventListener("click",()=>{placed=start.slice();choose(2,false);status.textContent="已还原，趴卧猴和探头猴在山上。";thumbButtons[selected].focus({preventScroll:true})});
  render();
})();
