(() => {
  "use strict";
  const host=document.querySelector(".intro-person .portrait-composition");
  const photo=host?.querySelector(".intro-portrait");
  if(!photo || host.querySelector(".portrait-field"))return;
  const width=1118,height=1349;
  // Coordinates are in the original photograph, independent of its responsive
  // contain box. Only solid areas of the cutout take pointer input.
  const parts=[
    {name:"学士帽与面部",cx:405,cy:191,r:170,d:"M220 230 314 15 542 115 493 239Q507 281 494 308L506 328 477 352 430 399 383 373 354 319 349 302Z"},
    {name:"毕业手牌",cx:257,cy:348,r:95,d:"M210 327Q218 306 248 303L271 304Q295 305 304 324L309 357Q304 374 279 391L254 393Q226 388 214 374Z"},
    {name:"持牌的手",cx:274,cy:473,r:118,d:"M236 403Q241 389 272 397L297 409 285 421Q306 418 313 436L314 469 297 493 309 552 307 618 291 683 267 708 251 669 251 566 249 499Q232 476 229 448Z"},
    {name:"学位服",cx:455,cy:565,r:205,d:"M352 342 385 377 432 403 492 322 565 354 654 394Q705 411 718 477L734 571 724 709Q717 787 665 848L609 864 367 856 187 864Q142 859 132 808L126 772 146 691 177 615 203 563 207 500 225 470 249 503 248 669 266 711 295 684 311 619 311 541 297 493 317 466 315 429 301 415Z"},
    {name:"裤脚与鞋",cx:408,cy:998,r:207,d:"M156 876Q263 858 345 873L449 861 578 864 683 897Q734 910 749 970L790 1156 787 1183 634 1186 609 1206 605 1255 588 1317 568 1330 536 1325 514 1302 451 1284 415 1258 414 1236 380 1223 305 1300 281 1309 239 1273 209 1225 218 1198 130 1203 21 1216 35 1144 55 1068 50 1019 44 979 58 930 79 906Z"}
  ];
  const treatments=["像素拼版","彩点网印","水墨分色","柔焦"];
  const svgNS="http://www.w3.org/2000/svg";
  const field=document.createElement("div"),svg=document.createElementNS(svgNS,"svg");
  const control=document.createElement("button"),live=document.createElement("span");
  field.className="portrait-field";
  svg.setAttribute("class","portrait-hits");
  svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
  svg.setAttribute("role","button");
  svg.setAttribute("tabindex","0");
  svg.setAttribute("aria-label","随机显影肖像局部。回车或空格再试一次，Esc 还原");
  control.className="portrait-tool";
  control.type="button";
  live.className="portrait-live";
  live.setAttribute("aria-live","polite");
  live.setAttribute("aria-atomic","true");
  for(const part of parts){
    const path=document.createElementNS(svgNS,"path");
    path.setAttribute("d",part.d);
    path.setAttribute("aria-hidden","true");
    const title=document.createElementNS(svgNS,"title");
    title.textContent="点按肖像，随机显影";
    path.append(title);
    svg.append(path);
    part.outline=new Path2D(part.d);
  }
  field.append(svg,control,live);
  host.append(field);
  host.removeAttribute("aria-hidden");
  const curve=new Path2D();
  // Preserve the vermilion cord with its original weave and color.
  curve.moveTo(540,595);curve.bezierCurveTo(615,542,673,484,720,500);curve.quadraticCurveTo(728,503,732,515);
  curve.moveTo(397,767);curve.bezierCurveTo(475,782,554,803,630,819);
  curve.moveTo(536,860);curve.bezierCurveTo(568,847,603,830,637,819);
  curve.moveTo(625,829);curve.bezierCurveTo(618,799,663,794,662,828);curve.bezierCurveTo(662,847,628,846,625,829);
  curve.moveTo(641,830);curve.quadraticCurveTo(634,848,627,867);
  curve.moveTo(660,828);curve.bezierCurveTo(720,875,759,921,783,980);curve.bezierCurveTo(823,1080,857,1127,928,1125);curve.bezierCurveTo(979,1127,1031,1092,1104,1149);
  const probe=document.createElement("canvas").getContext("2d");
  const motion=matchMedia("(prefers-reduced-motion:reduce)");
  let current=null,readable=true,particleFrame=0,expiry=0;
  const regionDeck={remaining:[],last:-1},effectDeck={remaining:[],last:-1};
  function sizeField(){
    const scale=Math.min(host.clientWidth/width,host.clientHeight/height);
    field.style.width=width*scale+"px";
    field.style.height=height*scale+"px";
  }
  if("ResizeObserver" in window)new ResizeObserver(sizeField).observe(host);
  else window.addEventListener("resize",sizeField,{passive:true});
  sizeField();

  function updateControl(){
    const modified=Boolean(current);
    control.dataset.active=String(modified);
    control.textContent=modified?"还原":"点按肖像";
    control.setAttribute("aria-label",modified?"还原整幅毕业肖像":"尝试随机肖像显影");
  }
  function stopParticles(){
    cancelAnimationFrame(particleFrame);
    particleFrame=0;
    current?.ink?.remove();
  }
  function clearMark(){
    clearTimeout(expiry);
    stopParticles();
    current?.surface.remove();
    current=null;
  }
  function reset(){
    clearMark();
    updateControl();
    live.textContent="已还原原始肖像";
  }
  function drawFrom(deck,count){
    if(!deck.remaining.length)deck.remaining=Array.from({length:count},(_,i)=>i);
    const choices=deck.remaining.filter(value=>value!==deck.last);
    const next=choices[Math.floor(Math.random()*choices.length)];
    deck.remaining.splice(deck.remaining.indexOf(next),1);
    deck.last=next;
    return next;
  }
  function sampleCentre(part){
    for(let i=0;i<16;i++){
      const x=part.cx+(Math.random()-.5)*part.r*.72;
      const y=part.cy+(Math.random()-.5)*part.r*.7;
      if(probe.isPointInPath(part.outline,x,y))return {x,y};
    }
    return {x:part.cx,y:part.cy};
  }
  function buffer(w,h){
    const el=document.createElement("canvas");
    el.width=w;el.height=h;return el;
  }
  function pixelStamp(ctx,raw,side){
    const tiles=Math.max(8,Math.round(side/10)),small=buffer(tiles,tiles);
    small.getContext("2d").drawImage(raw,0,0,tiles,tiles);
    ctx.imageSmoothingEnabled=false;
    ctx.filter="contrast(1.17)";
    ctx.drawImage(small,0,0,side,side);
    ctx.filter="none";
  }
  function printStamp(ctx,raw,side,tones){
    ctx.fillStyle="#d6c8a9";ctx.fillRect(0,0,side,side);
    if(!tones){
      ctx.filter="sepia(.45) contrast(1.3)";
      ctx.drawImage(raw,0,0);ctx.filter="none";
    }
    const step=Math.max(5,Math.round(side/42));
    const inks=["#766a5b","#b25547","#356466","#262525"];
    for(let row=0,y=2;y<side;row++,y+=step){
      for(let x=row%2?step*.5:0;x<side;x+=step){
        const i=(Math.floor(y)*side+Math.floor(x))*4;
        const density=tones?1-tones[i]/255:.47;
        const radius=step*(.10+.58*Math.sqrt(density));
        for(let layer=1;layer<4;layer++){
          ctx.fillStyle=inks[layer];
          ctx.beginPath();
          ctx.arc(x+(layer===1?step*.22:layer===2?-step*.18:0),y+(layer===2?step*.12:0),
            radius*(layer===3?.68:.78),0,Math.PI*2);
          ctx.fill();
        }
      }
    }
  }
  function inkStamp(ctx,raw,side,tones){
    if(!tones){
      ctx.filter="sepia(.5) contrast(2.5) brightness(1.35)";ctx.drawImage(raw,0,0);ctx.filter="none";
      return;
    }
    const palette=[[22,27,25],[54,58,51],[100,101,85],[162,155,132],[207,194,161],[232,220,187]];
    const result=ctx.createImageData(side,side);
    for(let i=0;i<tones.length;i+=4){
      const pixel=i/4,x=pixel%side,y=Math.floor(pixel/side);
      const grain=((x*13+y*11+(x*y)%17)%21)-10;
      const tone=tones[i]+grain+6*Math.sin(x*.12+y*.042);
      const c=palette[Math.max(0,Math.min(5,Math.floor(tone/41)))];
      result.data[i]=c[0]+grain*.48;result.data[i+1]=c[1]+grain*.4;
      result.data[i+2]=c[2]+grain*.34;result.data[i+3]=tones[i+3];
    }
    ctx.putImageData(result,0,0);
  }
  function scatter(mark,part,tones,left,top){
    const {surface,effect}=mark,side=surface.width,r=side/2;
    const ink=buffer(side,side),ctx=ink.getContext("2d");
    if(!ctx)return;
    ink.className="portrait-ink";
    ink.setAttribute("aria-hidden","true");
    ink.style.cssText=surface.style.cssText;
    field.insertBefore(ink,svg);
    mark.ink=ink;
    const palettes=[
      ["#e6d0ab","#d6a36d","#91aba4","#efdcbb"],
      ["#f6d49b","#dc765e","#78aca8","#ead7b9"],
      ["#e0d4b1","#b6b098","#eee1c7","#8a9a89"],
      ["#f4d4a5","#e4b88e","#c7cfbc","#fff0d3"]
    ];
    const grains=[];
    const count=Math.round(36+side*.24);
    const displayScale=Math.max(.12,field.clientWidth/width);
    const smallest=Math.max(side*.009,1.25/displayScale);
    for(let attempt=0;grains.length<count&&attempt<count*13;attempt++){
      const x=Math.random()*side,y=Math.random()*side,dx=x-r,dy=y-r;
      if(Math.hypot(dx,dy)>r*.88||!probe.isPointInPath(part.outline,x+left,y+top))continue;
      const i=(Math.floor(y)*side+Math.floor(x))*4;
      if(tones&&(tones[i+3]<195||tones[i]-tones[i+1]>9))continue;
      const phase=Math.atan2(dy,dx),kick=r*(.16+Math.random()*.47);
      grains.push({x,y,dx:Math.cos(phase)*kick,dy:Math.sin(phase)*kick,
        curve:(Math.random()-.45)*r*.42,lag:Math.random()*.17,
        size:smallest+Math.random()*(side*.008+1.1/displayScale),
        shade:palettes[effect][Math.floor(Math.random()*4)]});
    }
    const start=performance.now();
    function draw(now){
      if(current!==mark)return;
      const t=Math.min(1,(now-start)/1050);
      ctx.clearRect(0,0,side,side);
      for(const grain of grains){
        const u=Math.min(1,Math.max(0,(t-grain.lag)/(1-grain.lag)));
        if(!u||u>=1)continue;
        const sweep=Math.sin(Math.PI*u),bend=Math.sin(2*Math.PI*u);
        const x=grain.x+grain.dx*sweep-grain.curve*bend;
        const y=grain.y+grain.dy*sweep-grain.curve*sweep*.42;
        const size=grain.size*(.64+.48*sweep);
        ctx.fillStyle=grain.shade;
        ctx.globalAlpha=Math.min(1,u*8,(1-u)*4)*.91;
        if(effect===0)ctx.fillRect(x-size/2,y-size/2,size*1.3,size*.85);
        else{
          ctx.beginPath();
          ctx.ellipse(x,y,size*(effect===2?1.05:.62),size*(effect===2?.37:.62),effect===2?-.56:0,0,Math.PI*2);
          ctx.fill();
        }
      }
      // The moving grains use the same exact silhouette and thread cutout as the settled ink.
      ctx.globalAlpha=1;
      ctx.globalCompositeOperation="destination-in";
      ctx.drawImage(surface,0,0);
      ctx.globalCompositeOperation="source-over";
      if(t<1)particleFrame=requestAnimationFrame(draw);
      else stopParticles();
    }
    particleFrame=requestAnimationFrame(draw);
  }
  function apply(){
    if(!photo.complete||!photo.naturalWidth)return;
    const index=drawFrom(regionDeck,parts.length),effect=drawFrom(effectDeck,treatments.length);
    const part=parts[index],side=part.r*2,{x,y}=sampleCentre(part);
    const left=Math.round(x-part.r),top=Math.round(y-part.r);
    const surface=buffer(side,side),raw=buffer(side,side);
    const ctx=surface.getContext("2d"),source=raw.getContext("2d",{willReadFrequently:true});
    if(!ctx||!source)return;
    source.drawImage(photo,-left,-top,width,height);
    let samples=null;
    if(readable){
      try{samples=source.getImageData(0,0,side,side)}catch{readable=false}
    }
    const tones=samples?.data;
    if(effect===0)pixelStamp(ctx,raw,side);
    if(effect===1)printStamp(ctx,raw,side,tones);
    if(effect===2)inkStamp(ctx,raw,side,tones);
    if(effect===3){
      ctx.filter="blur("+Math.max(4,Math.round(side*.026))+"px) brightness(1.21) saturate(.67)";
      ctx.drawImage(raw,0,0);ctx.filter="none";
      ctx.globalAlpha=.42;ctx.drawImage(raw,0,0);ctx.globalAlpha=1;
      ctx.globalCompositeOperation="screen";ctx.fillStyle="rgba(174,146,113,.12)";ctx.fillRect(0,0,side,side);
    }
    ctx.globalCompositeOperation="destination-in";
    ctx.drawImage(raw,0,0);
    const mask=ctx.createRadialGradient(part.r,part.r,part.r*.42,part.r,part.r,part.r);
    mask.addColorStop(0,"#000");mask.addColorStop(.5,"rgba(0,0,0,.93)");mask.addColorStop(1,"transparent");
    ctx.fillStyle=mask;ctx.fillRect(0,0,side,side);
    const trim=buffer(side,side),cut=trim.getContext("2d");
    cut.translate(-left,-top);cut.fill(part.outline);
    ctx.drawImage(trim,0,0);
    ctx.globalCompositeOperation="destination-out";ctx.translate(-left,-top);
    ctx.lineWidth=18;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke(curve);
    if(samples){
      // Also preserve fine red fringe pixels outside the hand-traced thread.
      const red=cut.createImageData(side,side);
      for(let i=0;i<tones.length;i+=4)red.data[i+3]=tones[i]-tones[i+1]>7&&tones[i]-tones[i+2]>9?255:0;
      cut.putImageData(red,0,0);
      ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(trim,0,0);
    }
    surface.className="portrait-stamp";
    surface.setAttribute("aria-hidden","true");
    Object.assign(surface.style,{left:left/width*100+"%",top:top/height*100+"%",width:side/width*100+"%",height:side/height*100+"%"});
    clearMark();
    field.insertBefore(surface,svg);
    const mark={surface,effect,ink:null};
    current=mark;
    if(!motion.matches&&surface.animate){
      surface.animate([{opacity:0},{opacity:.22,offset:.3},{opacity:1}],{duration:910,easing:"ease-out"});
      scatter(mark,part,tones,left,top);
    }
    expiry=setTimeout(()=>{
      if(current!==mark)return;
      if(motion.matches||!surface.animate){reset();return}
      const fade=surface.animate([{opacity:1},{opacity:0}],{duration:430,fill:"forwards"});
      fade.onfinish=()=>{if(current===mark)reset()};
    },4800);
    updateControl();
    live.textContent=part.name+" · "+treatments[effect];
  }
  svg.addEventListener("click",apply);
  svg.addEventListener("keydown",event=>{
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key===" "||event.key==="Enter"){
      event.preventDefault();
      if(!event.repeat)apply();
    }
  });
  field.addEventListener("keydown",event=>{if(event.key==="Escape"&&current){event.preventDefault();reset()}});
  control.addEventListener("click",()=>{if(current)reset();else apply()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&current)reset()});
  window.addEventListener("film-progress",()=>{if(current&&host.closest("[inert]"))reset()});
  motion.addEventListener("change",()=>{if(current)reset()});
  updateControl();
})();
