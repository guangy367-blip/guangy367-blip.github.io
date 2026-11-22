(() => {
  "use strict";
  const chapters = [
    {menu:"文创项目", english:"FORM", year:"2026", title:"把文化做成器物。", desc:"从太湖石到杜甫的茅屋，我用可以把玩、取用的小动作，让故事进入日常。", note:"猴山 · 开柜抓现行 · 怪兽很灵 · 杜甫的屋顶又飞了"},
    {menu:"品牌实习", english:"PRACTICE", year:"2025.06 — 09", title:"从一张主视觉，\n到一组物料。", desc:"在上海领健医疗科技有限公司实习期间，我独立完成多套活动视觉方案，也把主视觉延展到品牌海报和宣传物料。", note:"上海领健医疗科技有限公司 · 设计实习"},
    {menu:"项目合作", english:"DIALOGUE", year:"2025 — 2026", title:"让角色回应委托。", desc:"为济南绿城育华杨柳春风学校设计「杨柳」与「燕妮」，用柳叶和燕子的形态讲校园故事。在琉璃兽项目中，夔牛成为六角色瑞兽系列的起点。", note:"校园双 IP · 山海经瑞兽系列"}
  ];
  function mount(){
    let host = document.getElementById("journey");
    if (!host){
      const works = document.getElementById("works");
      if (!works) return;
      host = document.createElement("section"); host.id="journey"; works.before(host);
    }
    if (host.dataset.journeyMounted) return;
    host.dataset.journeyMounted="true";
    host.setAttribute("aria-label","何星霆的文创设计经历");
    const cells=chapters.map((c,i)=>`<article class="jr-chapter" id="studio-chapter-${i+1}" aria-labelledby="jr-heading-${i}">
      <div class="jr-date"><span class="jr-folio">0${i+1}</span><span class="jr-date-line"></span><span>${c.year}</span></div>
      <div class="jr-content"><span lang="en" class="jr-word">${c.english}</span>
      <h2 id="jr-heading-${i}">${c.title.replace("\n","<br>")}</h2><p>${c.desc}</p><small>${c.note}</small></div></article>`).join("");
    host.innerHTML=`<div class="jr-stage"><div class="jr-space" aria-hidden="true"><picture><source media="(max-width:700px)" srcset="media/studio-compact.webp"><img src="media/studio-wide.webp" alt="" loading="lazy" decoding="async"></picture></div>
      <div aria-hidden="true" class="jr-shade"></div>
      <header class="jr-kicker"><span>设计经历</span><span lang="en">Studio journal</span></header>
      <div class="jr-cells">${cells}</div>
      <nav aria-label="设计经历章节" class="jr-nav">${chapters.map((c,i)=>`<a href="#studio-chapter-${i+1}" data-jr="${i}"><i aria-hidden="true"></i>${c.menu}</a>`).join("")}</nav></div>`;
    const stage=host.querySelector(".jr-stage"), space=host.querySelector(".jr-space"), shade=host.querySelector(".jr-shade");
    const cards=[...host.querySelectorAll(".jr-chapter")], buttons=[...host.querySelectorAll(".jr-nav a")];
    const narrow=matchMedia("(max-width:700px), (max-height:520px)"), reduced=matchMedia("(prefers-reduced-motion:reduce)");
    let useMotion=false,active=-1,raf=0,visible=false;
    function select(i){
      if(active===i) return; active=i;
      host.dataset.active=i;
      cards.forEach((node,k)=>{
        node.classList.toggle("jr-current",k===i);
        if(useMotion) node.setAttribute("aria-hidden",String(k!==i)); else node.removeAttribute("aria-hidden");
      });
      buttons.forEach((node,k)=>{if(k===i)node.setAttribute("aria-current","step");else node.removeAttribute("aria-current")});
    }
    function paint(){
      raf=0;
      if(!useMotion){
        const target=.5*window.innerHeight;
        let best=0,dist=Infinity;
        cards.forEach((card,i)=>{const rect=card.getBoundingClientRect();const d=Math.abs(rect.top+rect.height*.45-target);if(d<dist){dist=d;best=i}});
        select(best); return;
      }
      const box=host.getBoundingClientRect();
      const range=Math.max(1,host.offsetHeight-stage.offsetHeight);
      const p=Math.max(0,Math.min(1,-box.top/range));
      // Three framings of the same still. Position is evaluated directly from
      // the user's scroll position, so trackpad reversal never queues a tween.
      const stops=[[0,0,1.025],[6.8,-4.5,1.45],[-16,-9,1.92]];
      const t=p*2,i=Math.min(1,Math.floor(t)),x=t-i;
      const s=x*x*(3-2*x),a=stops[i],b=stops[i+1];
      const tween=k=>a[k]+(b[k]-a[k])*s;
      space.style.transform=`translate3d(${tween(0).toFixed(3)}%,${tween(1).toFixed(3)}%,0) scale(${tween(2).toFixed(4)})`;
      shade.style.opacity=(.91+Math.sin(p*Math.PI)*.085).toFixed(3);
      select(Math.min(2,Math.floor(t+.5)));
    }
    function tick(){if(visible&&!raf) raf=requestAnimationFrame(paint)}
    function configure(){
      useMotion=!narrow.matches&&!reduced.matches;
      host.classList.toggle("jr-film",useMotion);host.classList.toggle("jr-static",!useMotion);
      active=-1;space.style.transform=""; shade.style.opacity=""; paint();
    }
    function go(i){
      if(useMotion){
        const top=window.scrollY+host.getBoundingClientRect().top;
        window.scrollTo({top:top+(host.offsetHeight-stage.offsetHeight)*(i/2),behavior:"instant"});
        paint();
      } else cards[i].scrollIntoView({behavior:"instant",block:"center"});
    }
    buttons.forEach((btn,i)=>{
      btn.addEventListener("click",event=>{
        if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
        event.preventDefault();go(i);
      });
      btn.addEventListener("keydown",event=>{
        const next={ArrowRight:(i+1)%3,ArrowLeft:(i+2)%3,Home:0,End:2}[event.key];
        if(next===undefined)return;
        event.preventDefault();buttons[next].focus({preventScroll:true});go(next);
      });
    });
    const handleHash=()=>{const at=cards.findIndex(card=>"#"+card.id===location.hash);if(at>=0)go(at)};
    for(const query of [narrow,reduced])query.addEventListener("change",configure);
    window.addEventListener("resize",tick,{passive:true});
    window.addEventListener("scroll",tick,{passive:true});
    window.addEventListener("hashchange",handleHash);
    configure();
    if("IntersectionObserver" in window){
      const watcher=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)tick()}, {rootMargin:"70px"});
      watcher.observe(host);
    }else visible=true;
    if(location.hash.startsWith("#studio-chapter-"))requestAnimationFrame(handleHash);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
