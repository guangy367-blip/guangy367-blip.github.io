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
  svg.setAttribute("role","group");
  svg.setAttribute("aria-label","肖像局部印刷，方向键选择部位，回车变化，Esc 还原");
  control.className="portrait-tool";
  control.type="button";
  live.className="portrait-live";
  live.setAttribute("aria-live","polite");
  live.setAttribute("aria-atomic","true");
  const paths=parts.map((part,index)=>{
    const path=document.createElementNS(svgNS,"path");
    path.setAttribute("d",part.d);
    path.setAttribute("role","button");
    path.setAttribute("aria-label","改变"+part.name+"的局部印刷效果");
    path.setAttribute("tabindex",index===0?"0":"-1");
    const title=document.createElementNS(svgNS,"title");
    title.textContent="点按"+part.name+"，改变局部印刷";
    path.append(title);
    svg.append(path);
    return path;
  });
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
  const marks=new Map();
  const motion=matchMedia("(prefers-reduced-motion:reduce)");
  let chosen=0,last=-1,readable=true,bag=[];
  function sizeField(){
    const scale=Math.min(host.clientWidth/width,host.clientHeight/height);
    field.style.width=width*scale+"px";
    field.style.height=height*scale+"px";
  }
  if("ResizeObserver" in window)new ResizeObserver(sizeField).observe(host);
  else window.addEventListener("resize",sizeField,{passive:true});
  sizeField();

  function updateControl(){
    const modified=marks.size>0;
    control.dataset.active=String(modified);
    control.textContent=modified?"还原":"点按肖像";
    control.setAttribute("aria-label",modified?"还原整幅毕业肖像":"尝试肖像的局部印刷效果");
  }
  function reset(){
    for(const mark of marks.values())mark.surface.remove();
    marks.clear();
    updateControl();
    live.textContent="已还原原始肖像";
  }
  function choosePart(index,focus=false){
    paths[chosen].setAttribute("tabindex","-1");
    chosen=(index+parts.length)%parts.length;
    paths[chosen].setAttribute("tabindex","0");
    if(focus)paths[chosen].focus({preventScroll:true});
  }
  function nextEffect(index){
    if(!bag.length)bag=[0,1,2,3];
    const avoid=marks.get(index)?.effect;
    let choices=bag.filter(value=>value!==last&&value!==avoid);
    if(!choices.length)choices=[0,1,2,3].filter(value=>value!==last&&value!==avoid);
    const effect=choices[Math.floor(Math.random()*choices.length)];
    bag=bag.filter(value=>value!==effect);
    if(bag.length===1&&bag[0]===last)bag=[];
    last=effect;
    return effect;
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
  function apply(index,x,y){
    if(!photo.complete||!photo.naturalWidth)return;
    const part=parts[index],effect=nextEffect(index),side=part.r*2;
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
    cut.translate(-left,-top);cut.fill(new Path2D(part.d));
    ctx.drawImage(trim,0,0);
    ctx.globalCompositeOperation="destination-out";ctx.translate(-left,-top);
    ctx.lineWidth=18;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke(curve);
    if(samples){
      // Also preserve fine red fringe pixels outside the hand-traced thread.
      for(let i=0;i<tones.length;i+=4)tones[i+3]=tones[i]-tones[i+1]>7&&tones[i]-tones[i+2]>9?255:0;
      cut.putImageData(samples,0,0);
      ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(trim,0,0);
    }
    surface.className="portrait-stamp";
    surface.setAttribute("aria-hidden","true");
    Object.assign(surface.style,{left:left/width*100+"%",top:top/height*100+"%",width:side/width*100+"%",height:side/height*100+"%"});
    marks.get(index)?.surface.remove();
    field.insertBefore(surface,svg);
    marks.set(index,{surface,effect});
    if(!motion.matches&&surface.animate)surface.animate([{opacity:0},{opacity:1}],{duration:210,easing:"ease-out"});
    updateControl();
    live.textContent=part.name+" · "+treatments[effect];
  }
  paths.forEach((path,index)=>{
    path.addEventListener("click",event=>{
      choosePart(index);
      const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
      const {cx,cy}=parts[index];
      apply(index,event.detail?point.x:cx,event.detail?point.y:cy);
    });
    path.addEventListener("keydown",event=>{
      if(event.altKey||event.ctrlKey||event.metaKey)return;
      if(["ArrowLeft","ArrowUp","ArrowRight","ArrowDown","Home","End"].includes(event.key)){
        event.preventDefault();
        const target=event.key==="Home"?0:event.key==="End"?parts.length-1:index+(["ArrowRight","ArrowDown"].includes(event.key)?1:-1);
        choosePart(target,true);
      }else if(event.key===" "||event.key==="Enter"){
        event.preventDefault();apply(index,parts[index].cx,parts[index].cy);
      }
    });
  });
  field.addEventListener("keydown",event=>{if(event.key==="Escape"&&marks.size){event.preventDefault();reset()}});
  control.addEventListener("click",()=>{if(marks.size)reset();else apply(chosen,parts[chosen].cx,parts[chosen].cy)});
  updateControl();
})();
