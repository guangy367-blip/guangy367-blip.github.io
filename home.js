(() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const modes = [...document.querySelectorAll("[data-view]")];
  modes.forEach(button => button.addEventListener("click",() => {
    if (button.closest(".view-switch")?.hasAttribute("data-proof-ready")) return;
    document.querySelector("#cards").classList.toggle("list",button.dataset.view === "list");
    modes.forEach(el => el.setAttribute("aria-pressed",String(el === button)));
  }));
  const box=document.querySelector("#contact"), status=document.querySelector("#copy-status");
  document.querySelectorAll("[data-contact]").forEach(b=>b.addEventListener("click",()=>{
    status.textContent="";box.showModal();document.body.style.overflow="hidden";
  }));
  box.addEventListener("close",()=>document.body.style.overflow="");
  box.addEventListener("click",e=>{if(e.target===box)box.close();});
  document.querySelector("#dismiss").addEventListener("click",()=>box.close());
  const sealButton=box.querySelector(".calling-seal");
  const sealPrint=box.querySelector(".seal-print");
  const projectLink=box.querySelector(".calling-project");
  const imprints=[
    {print:"猴山",title:"猴山",key:"monkey"},
    {print:"开柜",title:"开柜抓现行",key:"cabinet"},
    {print:"瑞兽",title:"怪兽很灵",key:"beasts"},
    {print:"茅屋",title:"杜甫的屋顶又飞了",key:"dufu"}
  ];
  let nextImprint=0;
  sealButton.addEventListener("click",()=>{
    const imprint=imprints[nextImprint];
    sealPrint.textContent=imprint.print;
    sealPrint.dataset.shape=imprint.key;
    sealButton.querySelector(".seal-label").textContent="换枚印章";
    projectLink.href="case.html?p="+imprint.key;
    projectLink.textContent="看《"+imprint.title+"》 ↗";
    projectLink.hidden=false;
    status.textContent="已盖上《"+imprint.title+"》作品印";
    nextImprint=(nextImprint+1)%imprints.length;
    if(!motion.matches){
      sealPrint.getAnimations().forEach(animation=>animation.cancel());
      sealPrint.animate([{opacity:.15,transform:"scale(1.2) rotate(-13deg)"},{opacity:1,transform:"scale(.97) rotate(-6deg)",offset:.65},{transform:"scale(1) rotate(-6deg)"}],{duration:260,easing:"ease-out"});
    }
  });
  document.querySelector("#copy-email").addEventListener("click",async()=>{
    try{await navigator.clipboard.writeText("2100391483@qq.com");status.textContent="邮箱已复制";}
    catch{const range=document.createRange();range.selectNodeContents(box.querySelector(".mail"));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);status.textContent="已选中邮箱，可直接复制";}
  });
  if("IntersectionObserver" in window && !motion.matches){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(!entry.isIntersecting)return;
        if(entry.target.matches(".card") && entry.target.closest("#works")?.hasAttribute("data-index-view")){
          observer.unobserve(entry.target);return;
        }
        entry.target.animate([{transform:"translateY(16px)",opacity:.58},{transform:"none",opacity:1}],{duration:480,easing:"cubic-bezier(.2,.75,.2,1)"});
        observer.unobserve(entry.target);
      });
    },{threshold:.12});
    document.querySelectorAll(".card,.bio").forEach(el=>observer.observe(el));
  }
})();
