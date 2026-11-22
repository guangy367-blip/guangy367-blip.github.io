(() => {
  "use strict";

  const projects = [
    {tab:"杨柳春风",year:"2025.12",category:"校园吉祥物",title:"杨柳与燕妮",client:"济南绿城育华杨柳春风学校",description:"把柳叶、燕子的形态融进发饰和衣摆，让一对校园角色分别带出地域意象与书香气质。",output:"双角色设定、三视图与校园文创延展",theme:"willow"},
    {tab:"玉漱",year:"2026.09",category:"品牌 IP 提案",title:"玉漱 · 冠灵",client:"玉漱 IP 形象设计",description:"为品牌探索十套角色方向。「冠灵」选取不同时期的冠饰与衣纹，以统一的比例和轮廓，把汉、宋、明的造型串成系列。",output:"十套创意提案，图示为「冠灵」系列节选",theme:"porcelain"},
    {tab:"琉璃兽",year:"2026.10",category:"餐饮品牌 IP",title:"一炉六瑞",client:"南京琉璃兽餐饮管理有限责任公司",description:"把烧肉餐桌上的体验分给六位山海灵兽。驺吾迎席，鹿蜀择肉，兕掌炉。每一位角色都承担一种具体的待客动作。",output:"山海经瑞兽系列提案，图示为其中一套六角色阵容",theme:"hearth"}
  ];
  const img=(file,alt,cls="")=>`<img class="${cls}" data-file="media/commission-${file}.webp" alt="${alt}" decoding="async" draggable="false">`;
  const willow=`<div class="cm-art cm-willow"><i class="cm-ring" aria-hidden="true"></i><span class="cm-glyphs" aria-hidden="true">柳　燕</span>
    <div class="cm-pair">${img("willow-boy","杨柳男孩，柳枝发饰与淡绿长袍")}${img("willow-girl","燕妮的跃起姿态与绕身飘带")}</div>
    <span class="cm-colophon">校园角色原稿</span></div>`;
  const porcelain=`<div class="cm-art cm-porcelain"><div class="cm-prints">${[["han","汉"],["song","宋"],["ming","明"]].map(([k,n])=>`<figure>${img(k,"冠灵·"+n+"，玉漱角色设计原稿")}</figure>`).join("")}</div><span class="cm-colophon">冠灵系列 · 汉 / 宋 / 明</span></div>`;
  const herd=["驺吾 · 迎席","鹿蜀 · 择肉","兕 · 掌炉","九尾狐 · 分味","猼訑 · 敢尝","狡 · 丰席"];
  const hearth=`<div class="cm-art cm-hearth"><div class="cm-six">${herd.map((name,i)=>`<figure>${img("liuli-"+(i+1),name)}<figcaption>${name}</figcaption></figure>`).join("")}</div><span class="cm-colophon">一炉六瑞 · 角色设定</span></div>`;
  function mount() {
    let host=document.getElementById("journey");
    if(!host){const works=document.getElementById("works");if(!works)return;host=document.createElement("section");host.id="journey";works.before(host)}
    if(host.hasAttribute("data-commissions"))return;
    host.dataset.commissions="";host.setAttribute("aria-labelledby","cm-title");
    const art=[willow,porcelain,hearth];
    host.innerHTML=`<div class="cm-shell"><header class="cm-head"><div><p class="cm-eyeline" lang="en">Selected commissions</p><h2 id="cm-title">委托设计经历</h2></div>
      <div class="cm-tabs" role="tablist" aria-label="选择委托案例">${projects.map((p,i)=>`<button id="cm-tab-${i}" type="button" role="tab" aria-controls="cm-panel-${i}">${p.tab}</button>`).join("")}</div></header>
      <div class="cm-panels">${projects.map((p,i)=>`<section id="cm-panel-${i}" data-theme="${p.theme}" class="cm-panel" tabindex="0" role="tabpanel" aria-labelledby="cm-tab-${i}" hidden><div class="cm-copy">
        <p class="cm-meta"><time datetime="${p.year.replace(".","-")}">${p.year}</time><span>${p.category}</span></p><h3>${p.title}</h3>
        <p class="cm-client">${p.client}</p><p class="cm-description">${p.description}</p>
        <dl><dt>交付内容</dt><dd>${p.output}</dd></dl></div>${art[i]}</section>`).join("")}</div></div>`;
    const buttons=[...host.querySelectorAll('[role="tab"]')],panels=[...host.querySelectorAll('[role="tabpanel"]')];
    const reduced=matchMedia("(prefers-reduced-motion:reduce)");
    let active=-1,visible=false;
    const load=i=>{panels[i].querySelectorAll("img[data-file]").forEach(im=>{im.src=im.dataset.file;im.removeAttribute("data-file")})};
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
        const next={ArrowLeft:(i+2)%3,ArrowRight:(i+1)%3,Home:0,End:2}[event.key];
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
      if(Math.abs(dx)>52&&Math.abs(dx)>Math.abs(dy)*1.5)show((active+(dx<0?1:2))%3);
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
