(() => {
  "use strict";

  const projects = [
    {tab:"杨柳春风",year:"2025.12",category:"校园吉祥物",title:"杨柳与燕妮",client:"济南绿城育华杨柳春风学校",description:"把柳叶、燕子的形态融进发饰和衣摆，让一对校园角色分别带出地域意象与书香气质。",output:"双角色设定、三视图与校园文创延展",theme:"willow"},
    {tab:"KHS 海豹",year:"2025.09",category:"赛事吉祥物",title:"KHS 游泳海豹",client:"KHS 中外青少年游泳赛事",description:"两只斑点海豹戴上泳镜、抬起脚蹼，用同一个起步动作呼应青少年游泳赛。湖蓝与玫粉区分两款角色。",output:"蓝、粉两款赛事吉祥物角色设计",theme:"pool"},
    {tab:"玉漱",year:"2026.09",category:"品牌 IP 提案",title:"玉漱 · 冠灵",client:"玉漱 IP 形象设计",description:"为品牌探索十套角色方向。「冠灵」选取不同时期的冠饰与衣纹，以统一的比例和轮廓，把汉、宋、明的造型串成系列。",output:"十套创意提案，图示为「冠灵」系列节选",theme:"porcelain"},
    {tab:"捏捏乐",year:"2026.09",category:"解压玩具",title:"生肖捏捏乐",client:"十二生肖系列产品设计",description:"把十二生肖收进圆润的掌心体量。牛角、兔耳与猴尾保留各自的辨识度，短绒质感和收拢的轮廓让它们像在掌心里打盹。",output:"十二款生肖解压玩具造型设计",theme:"squeeze"},
    {tab:"琉璃兽",year:"2026.10",category:"餐饮品牌 IP",title:"琉璃兽 · 九尾狐",client:"南京琉璃兽餐饮管理有限责任公司",description:"九条尾巴向身前聚拢，围住圆润的狐身。粉色耳尖与尾尖呼应，为烧肉品牌的山海灵兽增添一点亲近感。",output:"《一炉六瑞》系列中的「九尾狐 · 分味」角色设定",theme:"hearth"}
  ];
  const img=(file,alt,cls="")=>`<img class="${cls}" data-file="media/commission-${file}.webp" alt="${alt}" decoding="async" draggable="false">`;
  const willow=`<div class="cm-art cm-willow"><i class="cm-ring" aria-hidden="true"></i><span class="cm-glyphs" aria-hidden="true">柳　燕</span>
    <div class="cm-pair">${img("willow-boy","杨柳男孩，柳枝发饰与淡绿长袍")}${img("willow-girl","燕妮的跃起姿态与绕身飘带")}</div>
    <span class="cm-colophon">校园角色原稿</span></div>`;
  const porcelain=`<div class="cm-art cm-porcelain"><div class="cm-prints">${[["han","汉"],["song","宋"],["ming","明"]].map(([k,n])=>`<figure>${img(k,"冠灵·"+n+"，玉漱角色设计原稿")}</figure>`).join("")}</div><span class="cm-colophon">冠灵系列 · 汉 / 宋 / 明</span></div>`;
  const pairs = [
    [["tiger","虎"],["monkey","猴"]],
    [["rabbit","兔"],["pig","猪"]],
    [["goat","羊"],["ox","牛"]],
    [["dragon","龙"],["snake","蛇"]],
    [["dog","狗"],["rooster","鸡"]],
    [["rat","鼠"],["horse","马"]]
  ];
  const pool = `<div class="cm-art cm-pool">
    ${[["blue","蓝色"],["pink","粉色"]].map(([color,label])=>`<figure class="cm-front-card cm-swim-card">
      <div class="cm-artwork"><i class="cm-water" aria-hidden="true"></i><i class="cm-lane" aria-hidden="true"></i>${img("seal-"+color+"-front",label+"泳镜和脚蹼的海豹吉祥物正面")}</div>
    </figure>`).join("")}</div>`;
  const squeeze = `<div class="cm-art cm-squeeze">
    ${pairs[0].map(([file,name])=>`<figure class="cm-front-card cm-toy-card"><div class="cm-artwork"><i class="cm-moon" aria-hidden="true"></i><i class="cm-hills" aria-hidden="true"></i><i class="cm-plinth" aria-hidden="true"></i>${img("zodiac-"+file,"生肖"+name+"捏捏乐正面")}</div></figure>`).join("")}
    <div class="cm-pager" role="group" aria-label="切换生肖组合">
      ${pairs.map(([left,right],i)=>`<button type="button" aria-pressed="${i===0}" aria-label="展示${left[1]}与${right[1]}" data-pair="${i}"></button>`).join("")}
    </div></div>`;
  const hearth = `<div class="cm-art cm-hearth"><figure class="cm-front-card cm-fox-card"><div class="cm-artwork">
    <i class="cm-fox-sun" aria-hidden="true"></i><i class="cm-fox-ridge" aria-hidden="true"></i><i class="cm-fox-ground" aria-hidden="true"></i>
    ${img("liuli-fox-cut","九尾狐正面，粉色耳尖与九条尾巴围绕乳白色狐身")}
  </div></figure></div>`;
  function wirePairs(host) {
    const stage=host.querySelector(".cm-squeeze");
    const buttons=[...stage.querySelectorAll("[data-pair]")];
    const pictures=stage.querySelectorAll("img");
    buttons.forEach((btn,i)=>btn.addEventListener("click",()=>{
      if(btn.getAttribute("aria-pressed")==="true")return;
      pairs[i].forEach(([file,name],index)=>{
        pictures[index].alt="生肖"+name+"捏捏乐正面";
        pictures[index].src="media/commission-zodiac-"+file+".webp";
        pictures[index].removeAttribute("data-file");
      });
      buttons.forEach((other,index)=>other.setAttribute("aria-pressed",String(index===i)));
    }));
  }
  function mount() {
    let host=document.getElementById("journey");
    if(!host){const works=document.getElementById("works");if(!works)return;host=document.createElement("section");host.id="journey";works.before(host)}
    if(host.hasAttribute("data-commissions"))return;
    host.dataset.commissions="";host.setAttribute("aria-labelledby","cm-title");
    const art=[willow,pool,porcelain,squeeze,hearth];
    const tabIds=["cm-tab-0","commission-khs","cm-tab-2","commission-squeeze","commission-liuli"];
    host.innerHTML=`<div class="cm-shell"><header class="cm-head"><div><p class="cm-eyeline" lang="en">Selected commissions</p><h2 id="cm-title">委托设计经历</h2></div>
      <div class="cm-tabs" role="tablist" aria-label="选择委托案例">${projects.map((p,i)=>`<button id="${tabIds[i]}" type="button" role="tab" aria-controls="cm-panel-${i}">${p.tab}</button>`).join("")}</div></header>
      <div class="cm-panels">${projects.map((p,i)=>`<section id="cm-panel-${i}" data-theme="${p.theme}" class="cm-panel" tabindex="0" role="tabpanel" aria-labelledby="${tabIds[i]}" hidden><div class="cm-copy">
        <p class="cm-meta"><time datetime="${p.year.replace(".","-")}">${p.year}</time><span>${p.category}</span></p><h3>${p.title}</h3>
        <p class="cm-client">${p.client}</p><p class="cm-description">${p.description}</p>
        <dl><dt>交付内容</dt><dd>${p.output}</dd></dl></div>${art[i]}</section>`).join("")}</div></div>`;
    const buttons=[...host.querySelectorAll('[role="tab"]')],panels=[...host.querySelectorAll('[role="tabpanel"]')];
    wirePairs(host);
    const reduced=matchMedia("(prefers-reduced-motion:reduce)");
    let active=-1,visible=false;
    const load=i=>{
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
      if(e.pointerType==="touch"&&e.target.closest(".cm-art")&&!e.target.closest(".cm-pager"))start=[e.pointerId,e.clientX,e.clientY];
    });
    host.addEventListener("pointerup",e=>{
      if(!start||start[0]!==e.pointerId)return;
      const dx=e.clientX-start[1],dy=e.clientY-start[2];start=null;
      if(Math.abs(dx)>52&&Math.abs(dx)>Math.abs(dy)*1.5){

        show((active+(dx<0?1:buttons.length-1))%buttons.length);
      }
    });
    host.addEventListener("pointercancel",()=>{start=null});
    function selectFromHash() {
      const index=tabIds.indexOf(location.hash.slice(1));
      if(index<0)return false;
      show(index);
      requestAnimationFrame(()=>host.scrollIntoView({block:"start",behavior:"instant"}));
      return true;
    }
    if(!selectFromHash())show(0);
    window.addEventListener("hashchange",selectFromHash);
    if("IntersectionObserver" in window){
      const watcher=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){visible=true;load(active);watcher.disconnect()}},{rootMargin:"250px"});
      watcher.observe(host);
    }else{visible=true;load(active)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
