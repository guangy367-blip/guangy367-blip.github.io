(() => {
  "use strict";

  const projects = [
    {tab:"杨柳春风",year:"2025.12",category:"校园吉祥物",title:"杨柳与燕妮",client:"济南绿城育华杨柳春风学校",description:"把柳叶、燕子的形态融进发饰和衣摆，让一对校园角色分别带出地域意象与书香气质。",output:"双角色设定、三视图与校园文创延展",theme:"willow"},
    {tab:"KHS 海豹",year:"2025.09",category:"赛事吉祥物",title:"KHS 游泳海豹",client:"KHS 中外青少年游泳赛事",description:"两只斑点海豹戴上泳镜、抬起脚蹼，用同一个起步动作呼应青少年游泳赛。湖蓝与玫粉区分两款角色。",output:"蓝、粉两款角色的正面、侧面与背面设定",theme:"pool"},
    {tab:"玉漱",year:"2026.09",category:"品牌 IP 提案",title:"玉漱 · 冠灵",client:"玉漱 IP 形象设计",description:"为品牌探索十套角色方向。「冠灵」选取不同时期的冠饰与衣纹，以统一的比例和轮廓，把汉、宋、明的造型串成系列。",output:"十套创意提案，图示为「冠灵」系列节选",theme:"porcelain"},
    {tab:"捏捏乐",year:"2026.09",category:"解压玩具",title:"生肖捏捏乐",client:"十二生肖系列产品设计",description:"把十二生肖收进圆润的掌心体量。牛角、兔耳与猴尾保留各自的辨识度，每款都用几种角度交代造型。",output:"十二款产品造型，两张完整设定稿",theme:"squeeze"},
    {tab:"琉璃兽",year:"2026.10",category:"餐饮品牌 IP",title:"琉璃兽 · 九尾狐",client:"南京琉璃兽餐饮管理有限责任公司",description:"九条尾巴向身前聚拢，围住圆润的狐身。粉色耳尖与尾尖呼应，为烧肉品牌的山海灵兽增添一点亲近感。",output:"《一炉六瑞》系列中的「九尾狐 · 分味」角色设定",theme:"hearth"}
  ];
  const img=(file,alt,cls="")=>`<img class="${cls}" data-file="media/commission-${file}.webp" alt="${alt}" decoding="async" draggable="false">`;
  const willow=`<div class="cm-art cm-willow"><i class="cm-ring" aria-hidden="true"></i><span class="cm-glyphs" aria-hidden="true">柳　燕</span>
    <div class="cm-pair">${img("willow-boy","杨柳男孩，柳枝发饰与淡绿长袍")}${img("willow-girl","燕妮的跃起姿态与绕身飘带")}</div>
    <span class="cm-colophon">校园角色原稿</span></div>`;
  const porcelain=`<div class="cm-art cm-porcelain"><div class="cm-prints">${[["han","汉"],["song","宋"],["ming","明"]].map(([k,n])=>`<figure>${img(k,"冠灵·"+n+"，玉漱角色设计原稿")}</figure>`).join("")}</div><span class="cm-colophon">冠灵系列 · 汉 / 宋 / 明</span></div>`;
  const sheets = [
    {file:"seal-blue", caption:"蓝色海豹三视图", width:2240, height:1390},
    {file:"seal-pink", caption:"粉色海豹三视图", width:2240, height:1390},
    {file:"squeeze-1", caption:"鼠、牛、虎、兔、龙、蛇", width:1024, height:1536},
    {file:"squeeze-2", caption:"马、羊、猴、鸡、狗、猪", width:1086, height:1448},
    {file:"liuli-fox", caption:"九尾狐 · 分味", width:1055, height:1491}
  ];
  function sheetButton(index) {
    const sheet = sheets[index];
    return `<button class="cm-sheet" type="button" data-sheet="${index}" aria-label="放大查看${sheet.caption}" aria-haspopup="dialog">
      ${img(sheet.file+"-sm",sheet.caption)}
      <span class="cm-sheet-cap"><span>${sheet.caption}</span><span class="cm-expand" aria-hidden="true">↗</span></span></button>`;
  }
  const pool = `<div class="cm-art cm-pool">${sheetButton(0)}${sheetButton(1)}</div>`;
  const squeeze = `<div class="cm-art cm-squeeze">${sheetButton(2)}${sheetButton(3)}</div>`;
  const hearth = `<div class="cm-art cm-hearth"><button type="button" data-sheet="4" class="cm-fox" aria-label="放大查看九尾狐设定图" aria-haspopup="dialog"><picture><source media="(min-width:691px)" data-large="media/commission-liuli-fox.webp">${img("liuli-4","九尾狐设定图，九条尾巴围绕乳白色狐身")}</picture></button><span class="cm-colophon">九尾狐 · 分味</span></div>`;

  function mountViewer(host) {
    const dialog = document.createElement("dialog");
    dialog.className = "cm-viewer";
    dialog.setAttribute("aria-labelledby","cm-viewer-title");
    dialog.innerHTML = `<header><h4 id="cm-viewer-title"></h4><button type="button" data-zoom aria-pressed="false">放大</button><button type="button" data-close autofocus>关闭</button></header>
      <div class="cm-viewport" tabindex="0" aria-label="原稿查看区"><img draggable="false" decoding="async" alt=""></div>`;
    host.append(dialog);
    const title = dialog.querySelector("h4");
    const viewport = dialog.querySelector(".cm-viewport");
    const photo = viewport.querySelector("img");
    const zoom = dialog.querySelector("[data-zoom]");
    let current, expanded = false;
    function sizePhoto() {
      if (!current || !dialog.open) return;
      const fit = Math.min(viewport.clientWidth/current.width, viewport.clientHeight/current.height);
      const scale = expanded ? Math.max(1, fit * 1.8) : fit;
      photo.style.width = Math.max(1, Math.floor(current.width * scale)) + "px";
      photo.style.height = Math.max(1, Math.floor(current.height * scale)) + "px";
    }
    function setZoom(value) {
      expanded = value;
      zoom.textContent = value ? "适应屏幕" : "放大";
      zoom.setAttribute("aria-pressed",String(value));
      sizePhoto();
    }
    host.querySelectorAll("[data-sheet]").forEach(button => button.addEventListener("click",() => {
      if (Number(host.dataset.swipeUntil || 0) > performance.now()) return;
      current = sheets[Number(button.dataset.sheet)];
      title.textContent = current.caption;
      photo.alt = current.caption;
      photo.src = `media/commission-${current.file}.webp`;
      photo.classList.toggle("cm-transparent-sheet",current.file.startsWith("seal"));
      dialog.showModal();
      setZoom(false);
      viewport.scrollTo(0,0);
    }));
    zoom.addEventListener("click",() => setZoom(!expanded));
    dialog.querySelector("[data-close]").addEventListener("click",() => dialog.close());
    dialog.addEventListener("close",() => {current=null;photo.removeAttribute("src")});
    window.addEventListener("resize",sizePhoto,{passive:true});
  }
  function mount() {
    let host=document.getElementById("journey");
    if(!host){const works=document.getElementById("works");if(!works)return;host=document.createElement("section");host.id="journey";works.before(host)}
    if(host.hasAttribute("data-commissions"))return;
    host.dataset.commissions="";host.setAttribute("aria-labelledby","cm-title");
    const art=[willow,pool,porcelain,squeeze,hearth];
    host.innerHTML=`<div class="cm-shell"><header class="cm-head"><div><p class="cm-eyeline" lang="en">Selected commissions</p><h2 id="cm-title">委托设计经历</h2></div>
      <div class="cm-tabs" role="tablist" aria-label="选择委托案例">${projects.map((p,i)=>`<button id="cm-tab-${i}" type="button" role="tab" aria-controls="cm-panel-${i}">${p.tab}</button>`).join("")}</div></header>
      <div class="cm-panels">${projects.map((p,i)=>`<section id="cm-panel-${i}" data-theme="${p.theme}" class="cm-panel" tabindex="0" role="tabpanel" aria-labelledby="cm-tab-${i}" hidden><div class="cm-copy">
        <p class="cm-meta"><time datetime="${p.year.replace(".","-")}">${p.year}</time><span>${p.category}</span></p><h3>${p.title}</h3>
        <p class="cm-client">${p.client}</p><p class="cm-description">${p.description}</p>
        <dl><dt>交付内容</dt><dd>${p.output}</dd></dl></div>${art[i]}</section>`).join("")}</div></div>`;
    const buttons=[...host.querySelectorAll('[role="tab"]')],panels=[...host.querySelectorAll('[role="tabpanel"]')];
    mountViewer(host);
    const reduced=matchMedia("(prefers-reduced-motion:reduce)");
    let active=-1,visible=false;
    const load=i=>{
      panels[i].querySelectorAll("source[data-large]").forEach(source=>{source.srcset=source.dataset.large;source.removeAttribute("data-large")});
      panels[i].querySelectorAll("img[data-file]").forEach(im=>{im.src=im.dataset.file;im.removeAttribute("data-file")});
    };
    function show(index,focus=false) {
      if (active===index)return;
      active=index;
      if(visible)load(index);
      buttons.forEach((btn,i)=>{btn.setAttribute("aria-selected",String(i===index));btn.tabIndex=i===index?0:-1;panels[i].hidden=i!==index});
      if(focus)buttons[index].focus({preventScroll:true});
      if(!reduced.matches){
        const surface=panels[index].querySelector(".cm-art");
        surface.animate?.([{opacity:.65,transform:"perspective(1400px) rotateY(-3deg) translateX(9px)"},{opacity:1,transform:"none"}],{duration:400,easing:"cubic-bezier(.16,.8,.2,1)"});
        panels[index].querySelector(".cm-copy").animate?.([{opacity:.35,transform:"translateY(5px)"},{opacity:1,transform:"none"}],{duration:300});
      }
    }
    buttons.forEach((btn,i)=>{
      btn.addEventListener("click",()=>show(i));
      btn.addEventListener("keydown",event=>{
        const count=buttons.length;
        const next={ArrowLeft:(i+count-1)%count,ArrowRight:(i+1)%count,Home:0,End:count-1}[event.key];
        if(next!==undefined){event.preventDefault();show(next,true)}
      });
    });
    // Swipe through the paper samples while leaving vertical page gestures native.
    let start;
    host.querySelector(".cm-panels").addEventListener("pointerdown",e=>{
      if(e.pointerType==="touch"&&e.target.closest(".cm-art"))start=[e.pointerId,e.clientX,e.clientY];
    });
    host.addEventListener("pointerup",e=>{
      if(!start||start[0]!==e.pointerId)return;
      const dx=e.clientX-start[1],dy=e.clientY-start[2];start=null;
      if(Math.abs(dx)>52&&Math.abs(dx)>Math.abs(dy)*1.5){
        host.dataset.swipeUntil=String(performance.now()+350);
        show((active+(dx<0?1:buttons.length-1))%buttons.length);
      }
    });
    host.addEventListener("pointercancel",()=>{start=null});
    show(0);
    if("IntersectionObserver" in window){
      const watcher=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){visible=true;load(active);watcher.disconnect()}},{rootMargin:"250px"});
      watcher.observe(host);
    }else{visible=true;load(active)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
