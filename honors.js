(() => {
  "use strict";
  const root=document.getElementById("honors");
  if(!root) return;
  const scriptRoot=new URL(".",document.currentScript?.src || location.href);
  function loadIfNeeded(test,src) {
    if(test()) return Promise.resolve();
    return new Promise(resolve=>{
      const el=document.createElement("script");el.src=new URL(src,scriptRoot).href;
      el.onload=el.onerror=resolve;document.head.append(el);
    });
  }
  let openRequested=location.hash==="#honors", showAll=null;
  window.addEventListener("open-honors",()=>{
    openRequested=true;if(showAll) showAll(true);
    root.scrollIntoView({behavior:"instant"});
  });
  // No certificate image is attached before a visitor selects a competition.
  Promise.all([loadIfNeeded(()=>Array.isArray(window.designHonorRecords),"honors-data.js"),
    loadIfNeeded(()=>Array.isArray(window.designCertificates),"honors-certs.js")]).then(init);

  function init() {
    const records=window.designHonorRecords || [], certs=window.designCertificates || [];
    if(!records.length) return;
    const map=[
      ["graduate",/优秀毕业生/],["campus",/学年荣誉|学校荣誉|校级|奖学金|优秀学生|三好学生/],
      ["dgs",/大广赛|大学生广告艺术大赛/],["academy",/学院奖/],
      ["british",/英国国际艺术/],["hkdesign",/香港[当當]代[设設][计計]/],
      ["defence",/国防/],["ice",/冰雕|广厦/],["lanqiao",/蓝桥/],
      ["icad",/ICAD|当代青年美术/],["eaststar",/东方创意之星/],
      ["bicc",/BICC|中英国际/],["sgadc",/SGADC|新加坡金沙/],
      ["packaging",/中国包装/],["ccnc",/中国好创意/],["future",/未来设计师/],
      ["eastdesign",/东方设计奖/],["straits",/两岸数字/],["asian",/亚洲大学生创意/],
      ["zhongyi",/艺美中国|全国艺术博览作品展/],["huichuang",/汇创青春/],["milan",/米兰/],
      ["brand",/中国品牌设计/],["newpoint",/新质点/],["cgda",/CGDA/i],
      ["zodiac",/吉庆生肖/],["tisdc",/TISDC|[臺台]湾国际学生|臺灣國際學生/],
      ["chinese",/中华设计奖/],["ktk",/KTK/]
    ];
    const groups=new Map();
    for(const cert of certs){
      if(!cert.path || !cert.group)continue;
      const id=map.find(([,pattern])=>pattern.test(cert.group))?.[0] || cert.group;
      if(!groups.has(id))groups.set(id,[]);
      groups.get(id).push(cert);
    }
    const rows=records.map(([date,title,level,family])=>({
      date,title,level,family,year:date.includes("学年")?"学年荣誉":date==="简历补录"?"简历补录":date.slice(0,4)
    })).sort((a,b)=>{
      const d=r=>r.date==="简历补录"?"0000":r.date.replace(/\D/g,"").padEnd(8,"0");
      return d(b).localeCompare(d(a));
    });
    root.setAttribute("aria-labelledby","honors-title");
    root.innerHTML=`<div class="honor-heading"><div><p class="eyebrow"><i></i> SELECTED HONORS</p><h2 id="honors-title">荣誉档案 <span lang="en">honors</span></h2></div><button class="honor-switch" type="button" aria-expanded="false" aria-controls="honor-records"></button></div>
      <div class="honor-tools" hidden><label>按年份<select aria-label="筛选荣誉年份"></select></label><label>检索荣誉<input type="search" placeholder="赛事、奖项或级别"></label><span class="honor-count" aria-live="polite"></span></div>
      <ul class="honor-records" id="honor-records"></ul><div class="honor-more-scans" hidden><h3>其他证书</h3><div class="honor-scan-groups"></div></div>
      <button class="honor-fold" type="button" hidden>收起档案</button>
      <dialog class="honor-viewer" aria-labelledby="honor-gallery-title"><header class="honor-dialog-head"><div><span class="honor-dialog-type">证书档案</span><h3 id="honor-gallery-title"></h3><p class="honor-current-detail" aria-live="polite"></p></div><button class="honor-close" type="button">关闭</button></header>
        <div class="honor-screen" tabindex="0" aria-label="证书图像"><img alt=""><span class="honor-error" role="status" hidden>这张证书未能载入。</span></div>
        <div class="honor-caption"><label class="honor-jump"><span>当前证书</span><select aria-label="跳至同组其他证书"></select></label><div class="honor-page-nav"><button type="button" class="honor-prev">上一张</button><span role="status" class="honor-position"></span><button type="button" class="honor-next">下一张</button><button type="button" class="honor-zoom" aria-pressed="false">放大</button></div></div></dialog>`;
    const $=s=>root.querySelector(s);
    const sw=$(".honor-switch"), tools=$(".honor-tools"), year=tools.querySelector("select"),
      search=tools.querySelector("input"), list=$(".honor-records"),extra=$(".honor-more-scans"),
      dlg=$(".honor-viewer"),img=$(".honor-screen img"),screen=$(".honor-screen"),
      jump=$(".honor-jump select"), zoom=$(".honor-zoom");
    const textEl=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el};
    let expanded=false,active=[],index=0,opener;
    const defaults=[
      rows.find(r=>r.family==="chinese"),rows.find(r=>r.date==="2026.08"&&r.family==="future"),
      rows.find(r=>r.date==="2026.04"&&r.family==="milan")
    ].filter(Boolean);
    const years=[...new Set(rows.map(r=>r.year))].sort((a,b)=>/^\d/.test(b)&&/^\d/.test(a)?b.localeCompare(a):/^\d/.test(a)?-1:/^\d/.test(b)?1:a.localeCompare(b));
    year.add(new Option("全部年份",""));years.forEach(y=>year.add(new Option(y,y)));
    function setZoom(on) {
      screen.classList.toggle("at-size",on);
      zoom.textContent=on?"适应屏幕":"放大";zoom.setAttribute("aria-pressed",String(on));
      if(!on){screen.scrollTop=0;screen.scrollLeft=0}
    }
    const labelFor=c=>[c.year,c.title,c.level,c.work && "《"+c.work+"》"].filter((v,i,arr)=>v && arr.indexOf(v)===i).join(" · ");
    function selectImage(i) {
      if(i<0||i>=active.length)return;
      index=i;const cert=active[i];
      $(".honor-current-detail").textContent=[cert.year,cert.level,cert.work && "《"+cert.work+"》"].filter(Boolean).join(" · ");
      img.width=cert.width;img.height=cert.height;img.alt=labelFor(cert)||cert.group;
      img.hidden=false;$(".honor-error").hidden=true;img.src=cert.path;
      screen.style.setProperty("--scan-width",Math.max(cert.width,Math.round(screen.clientWidth*1.15))+"px");
      $(".honor-prev").disabled=i===0;$(".honor-next").disabled=i===active.length-1;
      $(".honor-position").textContent=(i+1)+" / "+active.length;jump.value=String(i);setZoom(false);
    }
    function gallery(button,files,match) {
      active=files;opener=button;jump.replaceChildren();
      active.forEach((c,i)=>jump.add(new Option((i+1)+". "+(labelFor(c)||c.group),String(i))));
      $("#honor-gallery-title").textContent=active[0].group;
      dlg.showModal();document.body.classList.add("honor-modal-open");
      let selected=0;
      if(match){
        const years=match.date.match(/(?:19|20)\d{2}/g) || [];
        let best=0;
        active.forEach((cert,i)=>{
          const grades=String(cert.level || "").match(/金奖|银奖|铜奖|[一二三]等奖|优秀奖|入围奖|提名奖|提选/g) || [];
          const score=(years.includes(String(cert.year))?4:0)+(grades.some(g=>match.level.includes(g))?1:0);
          if(score>best){best=score;selected=i}
        });
      }
      selectImage(selected);$(".honor-close").focus();
    }
    function galleryButton(label,files,match) {
      const b=textEl("button",label);b.type="button";b.className="honor-scans";
      b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-label",files[0].group+"，查看同组 "+files.length+" 张证书");
      b.addEventListener("click",()=>gallery(b,files,match));return b;
    }
    function draw() {
      sw.textContent=expanded?"收起全部":"查看完整档案";sw.setAttribute("aria-expanded",String(expanded));
      tools.hidden=!expanded;$(".honor-fold").hidden=!expanded;list.replaceChildren();
      const query=search.value.toLocaleLowerCase().trim(),needle=s=>s.toLocaleLowerCase().includes(query);
      const found=expanded?rows.filter(r=>(!year.value||year.value===r.year)&&needle(r.date+" "+r.title+" "+r.level)):defaults;
      for(const row of found) {
        const item=document.createElement("li"),desc=document.createElement("div"),date=textEl("span",row.date);
        date.className="honor-date";desc.append(textEl("h3",row.title),textEl("p",row.level));item.append(date,desc);
        const files=groups.get(row.family);if(files?.length)item.append(galleryButton("查看同组证书",files,row));
        list.append(item);
      }
      $(".honor-count").textContent=found.length+" 条履历记录";
      if(!found.length){const empty=textEl("li","没有符合当前条件的履历记录。");empty.className="honor-empty";list.append(empty)}
      const extras=$(".honor-scan-groups");extras.replaceChildren();
      if(expanded){
        for(const [key,files] of groups) {
          if(rows.some(r=>r.family===key))continue;
          if(year.value&&!files.some(c=>String(c.year)===year.value))continue;
          if(!needle(files.map(c=>[c.title,c.level,c.group].join(" ")).join(" ")))continue;
          extras.append(galleryButton(files[0].group,files));
        }
      }
      extra.hidden=extras.childElementCount===0;
    }
    showAll=value=>{expanded=value;if(!value){year.value="";search.value=""}draw()};
    sw.addEventListener("click",()=>showAll(!expanded));
    $(".honor-fold").addEventListener("click",()=>{showAll(false);sw.focus({preventScroll:true});root.scrollIntoView()});
    search.addEventListener("input",draw);year.addEventListener("change",draw);
    jump.addEventListener("change",()=>selectImage(Number(jump.value)));
    $(".honor-prev").addEventListener("click",()=>selectImage(index-1));
    $(".honor-next").addEventListener("click",()=>selectImage(index+1));
    $(".honor-close").addEventListener("click",()=>dlg.close());
    zoom.addEventListener("click",()=>setZoom(!screen.classList.contains("at-size")));
    img.addEventListener("click",()=>zoom.click());
    img.addEventListener("error",()=>{img.hidden=true;$(".honor-error").hidden=false});
    dlg.addEventListener("keydown",e=>{
      if(e.target===jump || screen.classList.contains("at-size") || e.altKey || e.ctrlKey || e.metaKey)return;
      if(e.key==="ArrowLeft" || e.key==="ArrowRight"){e.preventDefault();selectImage(index+(e.key==="ArrowLeft"?-1:1))}
    });
    dlg.addEventListener("close",()=>{document.body.classList.remove("honor-modal-open");img.removeAttribute("src");opener?.focus({preventScroll:true})});
    showAll(openRequested);
  }
})();
