(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const catalog = window.catalog || {};
  const order = ["monkey", "cabinet", "beasts", "dufu"].filter(key => catalog[key]?.sections?.length);
  if (!order.length) { $("pages").textContent = "作品暂时无法读取。请返回作品索引重试。"; return; }

  const entries = [], plates = [], groups = new Map();
  const mobile = matchMedia("(max-width:780px)");
  let current = -1, positions = [], frame = 0;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function route(key, chapter = 1) {
    const url = new URL(location.href);
    url.searchParams.set("p", key);
    url.hash = chapter > 1 ? "chapter-" + chapter : "";
    return url;
  }
  function resolvedEntry() {
    const url = new URL(location.href);
    const key = groups.has(url.searchParams.get("p")) ? url.searchParams.get("p") : order[0];
    const n = Number(/^#chapter-(\d+)$/.exec(url.hash)?.[1] || 1);
    const group = groups.get(key);
    return group.start + Math.max(0, Math.min(group.count - 1, n - 1));
  }
  function setAddress(method, index) {
    const entry = entries[index];
    const url = route(entry.key, entry.number);
    if (url.href !== location.href) {
      try { history[method](null, "", url); } catch (_) { /* file previews may restrict URL state. */ }
    }
  }
  function navigation(link, index) {
    link.addEventListener("click", e => {
      if (e.button || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault();jump(index, true);
    });
  }
  function loadImage(record) {
    if (record.loaded) return;
    record.loaded = true;
    const {info, img} = record;
    if (info.small) {
      img.sizes = "(max-width:780px) 100vw, (min-width:2000px) 1660px, 84vw";
      img.srcset = info.small + " 720w, " + info.src + " " + info.w + "w";
    }
    img.src = info.src;
  }

  for (const [groupIndex, key] of order.entries()) {
    const work = catalog[key], start = entries.length;
    const project = node("div", "projects");
    const header = node("a", "project-link"); header.href = route(key).href;
    header.append(node("small", "", String(groupIndex + 1).padStart(2,"0")), node("span","",work.title), node("i"));
    navigation(header,start);
    const list = node("div","project-chapters");project.append(header,list);$("outline").append(project);
    groups.set(key,{start,count:work.sections.length,project});
    $("work-select").add(new Option(work.title,key));

    for (const [pos, section] of work.sections.entries()) {
      const index = entries.length, number = pos + 1;
      const entry = node("section","chapter"); entry.id = key + "-" + number;
      entry.setAttribute("aria-label",work.title + " · " + section.title);
      const link = node("a","chapter-link",section.title);link.href=route(key,number).href;
      navigation(link,index);list.append(link);
      const firstPlate = plates.length;
      for (const info of section.images) {
        const img = node("img");img.width=info.w;img.height=info.h;img.alt=info.alt||section.title;img.decoding="async";img.draggable=false;
        img.dataset.plate = plates.length;
        img.style.aspectRatio = info.w + " / " + info.h;
        plates.push({info,img,loaded:false});
        entry.append(img);
      }
      entries.push({key,number,entry,link,firstPlate,title:section.title});
      $("pages").append(entry);
    }
  }

  const chromeHeight = () => mobile.matches ? document.querySelector(".mobile-bar").offsetHeight : 0;
  function measure() {
    positions = entries.map(({entry}) => entry.getBoundingClientRect().top + window.scrollY);
  }
  function mark(index) {
    if (current===index) return;
    const previous = entries[current], record = entries[index], group = groups.get(record.key);
    if (previous) previous.link.removeAttribute("aria-current");
    if (!previous || previous.key!==record.key) {
      if (previous) groups.get(previous.key).project.removeAttribute("data-active");
      group.project.setAttribute("data-active","");
      $("work-select").value=record.key;
      $("section-select").replaceChildren();
      for(let n=0;n<group.count;n++) {
        const chapter=entries[group.start+n];
        $("section-select").add(new Option((n+1)+"/"+group.count+" · "+chapter.title,group.start+n));
      }
    }
    current=index;
    record.link.setAttribute("aria-current","location");
    $("section-select").value=String(index);$("read-name").textContent=catalog[record.key].title;
    $("read-step").textContent=record.number+" / "+group.count;
    document.title=catalog[record.key].title+" · "+record.title+" | 何星霆";
    if (!mobile.matches && !$("outline").matches(":hover")) {
      const a=record.link.getBoundingClientRect(), box=$("outline").getBoundingClientRect();
      if (a.top<box.top || a.bottom>box.bottom) $("outline").scrollTop+=a.top-box.top-box.height*.45;
    }
  }
  function read() {
    frame=0;
    const sightline=window.scrollY+chromeHeight()+Math.min(100,innerHeight*.12);
    let lo=0,hi=entries.length;
    while(lo+1<hi){const mid=(lo+hi)>>1;if(positions[mid]<=sightline)lo=mid;else hi=mid;}
    // A short final board can be fully visible before its top reaches the reading line.
    if (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 1) lo=entries.length-1;
    mark(lo);setAddress("replaceState",lo);
    const group=groups.get(entries[lo].key);
    const start=positions[group.start], end=positions[group.start+group.count] ?? ($("pages").getBoundingClientRect().bottom+scrollY);
    const span=Math.max(1,end-start-innerHeight+chromeHeight());
    $("meter").value=Math.max(0,Math.min(100,(window.scrollY+chromeHeight()-start)/span*100));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(read)}
  function jump(index,write) {
    const rec=entries[index];if(!rec)return;
    if(write)setAddress("pushState",index);
    loadImage(plates[rec.firstPlate]);
    const top=Math.max(0,positions[index]-chromeHeight());
    window.scrollTo({top,behavior:"instant"});mark(index);schedule();
  }
  $("work-select").addEventListener("change",()=>jump(groups.get($("work-select").value).start,true));
  $("section-select").addEventListener("change",()=>jump(Number($("section-select").value),true));
  $("reader").addEventListener("keydown",e=>{
    if(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !["ArrowLeft","ArrowRight"].includes(e.key))return;
    e.preventDefault();jump(Math.max(0,Math.min(entries.length-1,current+(e.key==="ArrowRight"?1:-1))),true);
  });
  measure();
  const target=resolvedEntry();
  plates[entries[target].firstPlate].img.fetchPriority="high";
  jump(target,false);
  if ("IntersectionObserver" in window) {
    const lazy=new IntersectionObserver(hit=>{
      for(const change of hit)if(change.isIntersecting){
        loadImage(plates[Number(change.target.dataset.plate)]);lazy.unobserve(change.target);
      }
    },{rootMargin:mobile.matches?"45% 0px":"80% 0px"});
    plates.forEach(item=>lazy.observe(item.img));
  } else {
    // Native lazy-loading fallback for browsers without IntersectionObserver.
    plates.forEach(item=>{item.img.loading="lazy";loadImage(item)});
  }
  addEventListener("scroll",schedule,{passive:true});
  addEventListener("resize",()=>{measure();schedule()},{passive:true});
  addEventListener("popstate",()=>jump(resolvedEntry(),false));
  addEventListener("pageshow",()=>{measure();schedule()});

})();
