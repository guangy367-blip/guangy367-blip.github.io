(() => {
  "use strict";

  function mount() {
    const works = document.getElementById("works");
    const cards = works?.querySelector("#cards");
    const switcher = works?.querySelector(".view-switch");
    if (!cards || !switcher || works.querySelector(".proof-table")) return;

    const originals = [...cards.querySelectorAll("a.card")];
    const entries = originals.map(card => ({
      original: card.querySelector(".photo img"),
      title: card.querySelector("h3")?.textContent,
      english: card.querySelector(".card-en")?.textContent,
      type: card.querySelector(".card-copy p")?.textContent,
      href: card.getAttribute("href")
    }));
    if (entries.length < 2 || entries.some(entry => !entry.original || !entry.title || !entry.href)) return;

    const table = document.createElement("div");
    table.className = "proof-table";
    table.id = "proof-table";
    table.setAttribute("role", "region");
    table.setAttribute("aria-label", "作品样张翻阅");
    table.innerHTML = `<div class="proof-pile" tabindex="0" role="group" aria-label="样张台，点击两侧、横向拖动或使用左右方向键翻阅"><span class="proof-cursor" aria-hidden="true"><i></i></span></div>
      <div class="proof-copy"><div class="proof-description"><p class="proof-type"></p><h3></h3><p class="proof-en" lang="en"></p>
      <a class="proof-link">查看项目详情<span aria-hidden="true">↗</span></a></div>
      <div class="proof-controls"><div class="proof-counter" aria-hidden="true"><b></b><i>/</i><span></span></div>
      <button type="button" class="proof-step proof-previous" aria-label="上一张作品"><i aria-hidden="true"></i></button>
      <button type="button" class="proof-step proof-next" aria-label="下一张作品"><i aria-hidden="true"></i></button></div></div>
      <span class="proof-sr" aria-live="polite" aria-atomic="true"></span>`;
    const pile = table.querySelector(".proof-pile");
    const info = table.querySelector(".proof-description");
    const title = info.querySelector("h3");
    const type = info.querySelector(".proof-type");
    const english = info.querySelector(".proof-en");
    const link = info.querySelector("a");
    const status = table.querySelector(".proof-sr");
    const current = table.querySelector(".proof-counter b");
    const total = entries.length;
    const pad = value => String(value).padStart(2, "0");
    table.querySelector(".proof-counter span").textContent = pad(total);
    const papers = entries.map(entry => {
      const figure = document.createElement("figure");
      figure.className = "proof-sheet";
      const image = document.createElement("img");
      image.alt = entry.original.alt;
      image.width = entry.original.width || 1440;
      image.height = entry.original.height || 811;
      // Natural proportions are taken from the artwork's HTML attributes even
      // when the alternate grid layout gives its source node a different size.
      for (const attr of ["width","height"]) {
        if (entry.original.hasAttribute(attr)) image.setAttribute(attr,entry.original.getAttribute(attr));
      }
      image.dataset.src = entry.original.getAttribute("src");
      if (entry.original.srcset) image.dataset.srcset = entry.original.srcset;
      image.sizes = "(max-width:720px) 90vw, (max-width:1800px) 60vw, 1000px";
      image.decoding = "async";
      image.draggable = false;
      figure.append(image);
      pile.append(figure);
      return figure;
    });

    const proofMode = document.createElement("button");
    proofMode.type = "button";
    proofMode.textContent = "翻阅";
    proofMode.dataset.view = "proof";
    proofMode.setAttribute("aria-controls",table.id);
    switcher.prepend(proofMode);
    cards.before(table);
    const modes = [...switcher.querySelectorAll("[data-view]")];
    switcher.dataset.proofReady = "";
    switcher.setAttribute("role","group");
    modes.forEach(button => {
      button.setAttribute("aria-controls",button === proofMode ? table.id : cards.id);
      const symbol = document.createElement("i");
      symbol.className = "index-mode-icon";
      symbol.setAttribute("aria-hidden","true");
      button.prepend(symbol);
    });
    const motion = matchMedia("(prefers-reduced-motion:reduce)");
    const slide = {ghost:null,target:null,animations:[]};
    const cursor = pile.querySelector(".proof-cursor");
    let selected = 0;
    let visible = false;
    let drag = null;
    let lastMode = null;
    let inkFrame = 0;
    let inkX = 0;
    let inkY = 0;

    function hydrate() {
      if (!visible || table.hidden) return;
      pile.querySelectorAll("img[data-src]").forEach(image => {
        if (image.dataset.srcset) image.srcset = image.dataset.srcset;
        image.src = image.dataset.src;
        delete image.dataset.src;
        delete image.dataset.srcset;
      });
    }

    function rankPapers(direction = 1) {
      papers.forEach((paper,index) => {
        const rank = ((index-selected)*direction+total)%total;
        paper.dataset.rank = rank;
        paper.setAttribute("aria-hidden",String(rank!==0));
      });
    }

    function present() {
      const entry = entries[selected];
      rankPapers();
      title.textContent = entry.title;
      type.textContent = entry.type;
      english.textContent = entry.english;
      current.textContent = pad(selected+1);
      link.href = entry.href;
      link.setAttribute("aria-label","查看《"+entry.title+"》项目详情");
      status.textContent = `第 ${selected+1} 张，共 ${total} 张，${entry.title}`;
    }

    function clearTurn() {
      pile.querySelectorAll(".proof-departing").forEach(sheet => sheet.remove());
      papers.forEach(paper => {
        paper.getAnimations().forEach(animation => animation.cancel());
        paper.style.removeProperty("transform");
      });
      info.getAnimations().forEach(animation => animation.cancel());
    }

    function turn(direction,offset=0,target=(selected+direction+total)%total) {
      if (target===selected) return;
      clearSlide();
      clearTurn();
      const leaving = papers[selected];
      rankPapers(direction);
      const arriving = papers[target];
      const before = getComputedStyle(arriving).transform;
      const animate = !motion.matches && typeof arriving.animate === "function";
      const sign = direction > 0 ? -1 : 1;
      if (animate) {
        const ghost = leaving.cloneNode(true);
        ghost.classList.add("proof-departing");
        ghost.setAttribute("aria-hidden","true");
        ghost.querySelector("img").alt = "";
        pile.append(ghost);
        const px = Math.max(0,Math.abs(offset));
        const animation = ghost.animate([
          {transform:`translate(${sign*px}px,-50%) rotate(${sign*(.65+px/35)}deg)`,opacity:1},
          {transform:`translate(${sign*28}%,-65%) rotate(${sign*11}deg)`,opacity:.8,offset:.52},
          {transform:`translate(${sign*38}%,-61%) rotate(${sign*15}deg)`,opacity:0}
        ],{duration:465,easing:"cubic-bezier(.2,.65,.23,1)",fill:"forwards"});
        animation.onfinish=()=>ghost.remove();
      }
      selected=target;
      present();
      if (animate) {
        arriving.animate([{transform:before},{transform:getComputedStyle(arriving).transform}],{duration:430,easing:"cubic-bezier(.2,.7,.2,1)"});
        info.animate([{opacity:.45,transform:"translateY(7px)"},{opacity:1,transform:"none"}],{duration:280});
      }
    }

    function clearDrag() {
      if (!drag) return;
      const id=drag.id;
      drag=null;
      delete pile.dataset.drag;
      delete pile.dataset.pressed;
      if (pile.hasPointerCapture(id)) pile.releasePointerCapture(id);
      papers[selected].style.removeProperty("transform");
    }

    function clearSlide() {
      for (const animation of slide.animations) animation.cancel();
      slide.animations.length = 0;
      if (slide.target) slide.target.removeAttribute("data-moving-print");
      slide.ghost?.remove();
      slide.target = slide.ghost = null;
    }

    function poster(mode) {
      return mode === "proof" ? papers[selected].firstElementChild : entries[selected].original;
    }

    function switchLayout(mode, oldRect) {
      if (!oldRect || motion.matches || !works.animate) return;
      const easing = "cubic-bezier(.22,.76,.21,1)";
      const target = poster(mode);
      const end = target.getBoundingClientRect();
      // Only travel with a print when its two positions lie inside the current
      // reading area. A print far below the viewport should simply stay there.
      const nearView = r => r.width > 0 && r.top < innerHeight+30 && r.bottom > 0;
      if (nearView(oldRect) && nearView(end) && target.complete && target.naturalWidth) {
        const bounds = works.getBoundingClientRect();
        const ghost = document.createElement("img");
        ghost.className = "index-travel-print";
        ghost.setAttribute("aria-hidden","true");
        ghost.alt = "";
        ghost.src = target.currentSrc || target.src;
        Object.assign(ghost.style,{left:(end.left-bounds.left)+"px",top:(end.top-bounds.top)+"px",width:end.width+"px",height:end.height+"px"});
        target.setAttribute("data-moving-print","");
        works.append(ghost);
        slide.target = target;
        slide.ghost = ghost;
        const travel = ghost.animate([
          {transform:`translate(${oldRect.left-end.left}px,${oldRect.top-end.top}px) scale(${oldRect.width/end.width},${oldRect.height/end.height})`},
          {transform:"none"}
        ],{duration:435,easing});
        travel.onfinish = () => {
          if(slide.ghost!==ghost)return;
          target.removeAttribute("data-moving-print");
          ghost.remove();
          slide.target = slide.ghost = null;
        };
        slide.animations.push(travel);
      }
      const enter = mode==="proof" ? [pile,info,table.querySelector(".proof-controls")] : originals;
      for(const [i,node] of enter.entries()){
        const x=mode==="list" ? -13 : 0;
        const y=mode==="list" ? 1 : mode==="proof" ? 9 : 16;
        slide.animations.push(node.animate([
          {opacity:.42,transform:`translate(${x}px,${y}px)`},{opacity:1,transform:"none"}
        ],{duration:310,delay:i*22,easing,fill:"backwards"}));
      }
    }

    function setMode(mode) {
      if(mode===lastMode)return;
      const previous = lastMode;
      clearSlide();
      clearDrag();
      clearTurn();
      clearPoint();
      const oldRect = previous && !motion.matches ? poster(previous).getBoundingClientRect() : null;
      const enabled = mode==="proof";
      cards.hidden=enabled;
      table.hidden=!enabled;
      cards.classList.toggle("list",mode==="list");
      works.dataset.indexView = mode;
      modes.forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.view===mode)));
      if (enabled) {
        present();
        hydrate();
      }
      lastMode = mode;
      switchLayout(mode,oldRect);
    }
    modes.forEach(button=>button.addEventListener("click",()=>setMode(button.dataset.view)));
    let pressedControl = null;
    function releaseControl() {
      pressedControl?.removeAttribute("data-index-press");
      pressedControl = null;
    }
    works.addEventListener("pointerdown",event => {
      if(!event.isPrimary || event.pointerType==="mouse")return;
      releaseControl();
      pressedControl=event.target.closest(".card,.view-switch button,.proof-step,.proof-link");
      pressedControl?.setAttribute("data-index-press","");
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"]){
      works.addEventListener(type,releaseControl);
    }
    originals.forEach((card,index) => {
      const remember = () => { if(lastMode!=="proof")selected=index };
      card.addEventListener("pointerenter",remember);
      card.addEventListener("focus",remember);
    });
    table.querySelector(".proof-previous").addEventListener("click",()=>turn(-1));
    table.querySelector(".proof-next").addEventListener("click",()=>turn(1));
    table.addEventListener("keydown",event=>{
      if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      event.preventDefault();
      clearDrag();
      if(event.key==="Home")turn(-1,0,0);
      else if(event.key==="End")turn(1,0,total-1);
      else turn(event.key==="ArrowRight"?1:-1);
    });
    function paintPoint() {
      inkFrame=0;
      const r=pile.getBoundingClientRect();
      if(!r.width)return;
      const x=Math.max(0,Math.min(r.width,inkX-r.left));
      const y=Math.max(0,Math.min(r.height,inkY-r.top));
      pile.dataset.point=x<r.width/2 ? "previous" : "next";
      cursor.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
      if(!motion.matches)pile.style.setProperty("--paper-lean",((x/r.width-.5)*1.8).toFixed(2)+"deg");
    }
    function clearPoint() {
      cancelAnimationFrame(inkFrame);
      inkFrame=0;
      delete pile.dataset.point;
      pile.style.removeProperty("--paper-lean");
    }
    pile.addEventListener("pointerdown",event=>{
      if(!event.isPrimary||event.button!==0||drag)return;
      clearTurn();
      pile.dataset.pressed="";
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,claimed:false,direction:0};
    });
    pile.addEventListener("pointermove",event=>{
      if(event.pointerType==="mouse"&&!drag){
        inkX=event.clientX;inkY=event.clientY;
        if(!inkFrame)inkFrame=requestAnimationFrame(paintPoint);
      }
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.claimed){
        if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
        if(Math.abs(dx)<=Math.abs(dy)){clearDrag();return}
        drag.claimed=true;
        pile.setPointerCapture(event.pointerId);
        pile.dataset.drag="";
      }
      const direction=dx<0?1:-1;
      if(drag.direction!==direction){rankPapers(direction);drag.direction=direction}
      drag.dx=dx;
      if(!motion.matches){
        const travel=Math.max(-pile.clientWidth*.3,Math.min(pile.clientWidth*.3,dx*.72));
        papers[selected].style.transform=`translate(${travel}px,-50%) rotate(${-.65+travel/35}deg)`;
      }
    });
    pile.addEventListener("pointerup",event=>{
      if(!drag||event.pointerId!==drag.id)return;
      const dx=drag.dx,claimed=drag.claimed,threshold=Math.min(70,Math.max(34,pile.clientWidth*.1));
      const tap=Math.abs(event.clientX-drag.x)<8 && Math.abs(event.clientY-drag.y)<8 && !claimed;
      clearDrag();
      if(Math.abs(dx)>=threshold)turn(dx<0?1:-1,dx*.72);
      else if(tap){const r=pile.getBoundingClientRect();turn(event.clientX<r.left+r.width/2?-1:1)}
      else rankPapers();
    });
    const cancel=()=>{clearDrag();rankPapers()};
    pile.addEventListener("pointercancel",cancel);
    pile.addEventListener("lostpointercapture",()=>{if(drag)cancel()});
    pile.addEventListener("pointerleave",()=>{clearPoint();if(drag&&!drag.claimed)cancel()});
    if("IntersectionObserver" in window){
      const watcher=new IntersectionObserver(events=>{
        if(events.some(entry=>entry.isIntersecting)){visible=true;hydrate();watcher.disconnect()}
      },{rootMargin:"360px"});
      watcher.observe(works);
    }else visible=true;
    present();
    setMode("proof");
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
  else mount();
})();
