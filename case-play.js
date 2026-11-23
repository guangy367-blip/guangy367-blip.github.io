(() => {
  "use strict";
  const works = {
    monkey: ["猴山", "磁吸猴山", "magnetic landscape", 11],
    cabinet: ["开柜抓现行", "拉开抽屉", "inside the drawer", 11],
    beasts: ["怪兽很灵", "给瑞兽配个心愿", "a wish for your desk", 13],
    dufu: ["杜甫的屋顶又飞了", "抽纸起风", "a poem in the wind", 7]
  };
  const query = new URLSearchParams(location.search);
  const key = Object.hasOwn(works, query.get("p")) ? query.get("p") : "monkey";
  const [title, activity, english, count] = works[key];
  const chapter = Math.max(1, Math.min(count, parseInt(query.get("from"), 10) || 1));
  const reader = "case.html?p=" + key + (chapter > 1 ? "#chapter-" + chapter : "");
  const byId = id => document.getElementById(id);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const art = id => "media/caseplay-" + id + ".webp";
  const tokenArt = index => "media/caseplay-token-" + index + ".svg";
  const root = byId("interactive");
  byId("return").href = reader;
  byId("activity").textContent = activity;
  byId("work-caption").textContent = title + " / " + english;
  document.title = activity + " · " + title + " | 何星霆";
  const announce = content => { byId("feedback").textContent = content; };
  const frame = (stage, controls) =>
    '<div class="exhibit"><div class="stage '+key+'">'+stage+'</div><div class="controls">'+controls+'<p id="feedback" role="status" aria-live="polite"></p></div></div>';
  const bounded = n => Math.min(1, Math.max(0,n));

  // A native click covers keyboard and touch taps. Pointer drags suppress only their own following click.
  function pull(handle, start, update, stop, activate) {
    let grip = null, swallow = 0;
    handle.addEventListener("pointerdown", e => {
      if(e.button !== 0 || grip) return;
      grip = {id:e.pointerId,y:e.clientY,initial:start(),active:false};
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", e => {
      if(!grip || e.pointerId!==grip.id) return;
      const dy=e.clientY-grip.y;
      if(Math.abs(dy)>4) grip.active=true;
      if(grip.active) update(grip.initial,dy);
    });
    function finish(e, cancelled) {
      if(!grip || grip.id!==e.pointerId) return;
      const was=grip; grip=null;
      if(handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      if(was.active) {swallow=performance.now()+480;stop(was.initial,e.clientY-was.y,cancelled);}
    }
    handle.addEventListener("pointerup", e=>finish(e,false));
    handle.addEventListener("pointercancel", e=>finish(e,true));
    handle.addEventListener("click", e=>{if(!e.detail || performance.now()>swallow) activate();});
  }

  function cabinet() {
    const cast = [
      ["lookout","放哨的","蓝袍小官正举袖远望，替同伴留意动静。"],
      ["thief","偷东西的","红袍里藏着东西，这回抓到了。"],
      ["innocent","装无辜的","黄衣小童站得端正，抬着头看你。"],
      ["sleeper","睡着的","帽檐遮住了眼睛，他还在打瞌睡。"]
    ];
    root.innerHTML=frame('<div class="cabinet-box"><div class="drawer-well"><div id="cast" class="cast"></div></div><button id="drawer" class="drawer" type="button" aria-expanded="false" aria-controls="cast" aria-label="拉开木抽屉"><img src="'+art("brass")+'" alt="" draggable="false"></button></div>',
      '<h2>谁在偷东西？</h2><p>向下拉铜环，逐个点看藏在抽屉里的小官。</p><button id="toggle" class="action">拉开抽屉 ↓</button><p id="found" class="counter"></p>');
    let p=0, open=false;
    const drawer=byId("drawer"), box=root.querySelector(".cabinet-box"), figures=byId("cast"), found=new Set();
    const buttons=cast.map(([id,label,story],i)=>{
      const b=document.createElement("button"); b.type="button";b.className="actor";b.setAttribute("aria-label","查看第"+(i+1)+"个角色");
      b.innerHTML='<img draggable="false" alt="" src="'+art(id)+'">';
      b.addEventListener("click",()=>{
        found.add(i);
        buttons.forEach(c=>c.removeAttribute("data-picked"));b.setAttribute("data-picked","");
        b.setAttribute("aria-label",label+"，再查看");
        if(!reduced()) b.animate([{transform:"translateY(0)"},{transform:"translateY(-10px)",offset:.45},{transform:"translateY(0)"}],{duration:340});
        byId("found").textContent=found.size+" / 4 已辨认";
        announce(label+" · "+story);
      });
      figures.append(b);return b;
    });
    function draw(v) {
      p=bounded(v);box.style.setProperty("--pull",p);
      figures.inert=p<.68;figures.setAttribute("aria-hidden",String(p<.68));
    }
    function settle(value) {
      open=value; box.classList.add("settle");draw(open?1:0);
      drawer.setAttribute("aria-expanded",String(open));drawer.setAttribute("aria-label",open?"合上木抽屉":"拉开木抽屉");
      byId("toggle").textContent=open?"合上抽屉 ↑":"拉开抽屉 ↓";
      if(!open) { buttons.forEach(b=>b.removeAttribute("data-picked"));announce(""); }
    }
    pull(drawer,()=>p,(start,dy)=>{box.classList.remove("settle");draw(start+dy/(box.clientHeight*.48))},
      (start,dy,cancel)=>settle(cancel?open:(Math.abs(dy)>12?dy>0:p>.5)),()=>settle(!open));
    byId("toggle").addEventListener("click",()=>settle(!open));settle(false);
  }

  function beasts() {
    const roles=[["dragon","小龙","祥瑞 · 生机"],["pixiu","小貔貅","纳福 · 聚财"],["qilin","小麒麟","温和 · 守护"],["lion","小石狮","镇宅 · 安定"],["xuanwu","小玄武","稳重 · 长久"]];
    const wishes=["自在","平安","如意","顺心","安定","喜乐"];
    root.innerHTML=frame('<div class="plinth"><div class="desk-shadow"></div><img id="pet" class="pet" alt=""><div class="display-token" id="dock"><img id="worn" alt="" hidden></div></div><div class="specimen-caption"><b id="role-name"></b><span id="quality"></span></div>',
      '<h2>桌面的守护</h2><p>选一只瑞兽，再点一枚祝愿牌，让它吸附在底座。</p><div id="pets" class="pet-options" role="group" aria-label="选择瑞兽"></div><div id="tokens" class="token-options" role="group" aria-label="选择祝愿牌"></div><button class="utility" id="detach">取下祝愿牌</button>');
    const pet=byId("pet"), worn=byId("worn"), dock=byId("dock"), selections=Array(roles.length).fill(-1);
    let active=0, flight=null;
    const petButtons=[], tokenButtons=[];
    function draw() {
      const [id,name,quality]=roles[active],wish=selections[active];
      pet.src=art(id);pet.alt=name+"正视图";byId("role-name").textContent=name;byId("quality").textContent=quality;
      petButtons.forEach((b,i)=>b.setAttribute("aria-pressed",String(active===i)));
      tokenButtons.forEach((b,i)=>b.setAttribute("aria-pressed",String(wish===i)));
      worn.hidden=wish<0;dock.classList.toggle("occupied",wish>=0);
      if(wish>=0){worn.src=tokenArt(wish);worn.alt=wishes[wish]+"祝愿牌";}
      byId("detach").disabled=wish<0;
    }
    roles.forEach(([,name],i)=>{
      const b=document.createElement("button");b.type="button";b.textContent=name;
      b.onclick=()=>{flight?.cancel();active=i;draw();announce(selections[i]<0?name+"的底座空着。":name+"已佩戴「"+wishes[selections[i]]+"」。")};
      petButtons.push(b);byId("pets").append(b);
    });
    wishes.forEach((name,i)=>{
      const b=document.createElement("button");b.type="button";b.setAttribute("aria-label","吸附"+name+"祝愿牌");
      b.innerHTML='<img alt="" draggable="false" src="'+tokenArt(i)+'">';
      b.onclick=()=>{
        flight?.cancel();selections[active]=i;draw();announce(roles[active][1]+"已配上「"+name+"」。");
        if(reduced())return;
        const a=b.firstChild.getBoundingClientRect(), z=worn.getBoundingClientRect();
        flight=worn.animate([{transform:"translate("+(a.x+a.width/2-z.x-z.width/2)+"px,"+(a.y+a.height/2-z.y-z.height/2)+"px) scale("+(a.width/z.width)+") rotate(-14deg)"},{transform:"none"}],{duration:480,easing:"cubic-bezier(.2,.8,.25,1)"});
        pet.animate([{transform:"translateY(0)"},{transform:"translateY(-8px)",offset:.7},{transform:"translateY(0)"}],{duration:560});
      };
      tokenButtons.push(b);byId("tokens").append(b);
    });
    byId("detach").onclick=()=>{flight?.cancel();selections[active]=-1;draw();announce("已取下祝愿牌。")};draw();
  }

  function dufu() {
    const verses=[["八月秋高风怒号","卷我屋上三重茅"],["茅飞渡江洒江郊","高者挂罥长林梢"],["安得广厦千万间","大庇天下寒士俱欢颜"]];
    root.innerHTML=frame('<div class="wind" aria-hidden="true"><i></i><i></i><i></i></div><div class="cottage"><i class="aperture"></i><img id="sheet" alt="" draggable="false" src="'+art("tissue")+'"><img class="house" alt="伏在茅屋顶上的杜甫纸巾盒" draggable="false" src="'+art("cottage")+'"><button id="grip" aria-label="从屋顶抽一张纸巾"></button></div>',
      '<h2>茅屋为秋风所破歌</h2><p>向上抽出屋顶的纸巾，随风读一句杜诗。</p><div class="poem" id="poem" aria-hidden="true"><span>杜甫</span><b>风从纸上起</b></div><button id="pluck" class="action">抽一张纸 ↑</button>');
    const room=root.querySelector(".stage"),sheet=byId("sheet"),unit=root.querySelector(".cottage"), poem=byId("poem");
    let p=0,n=0,busy=false;
    function draw(value) {p=bounded(value);unit.style.setProperty("--pull",p);}
    function release() {
      if(busy)return;busy=true;
      const verse=verses[n++%verses.length];poem.innerHTML='<span>杜甫</span><b>'+verse[0]+'，<br>'+verse[1]+'。</b>';
      announce("第"+n+"张，"+verse.join("，")+"。");byId("pluck").textContent="再抽一张 ↑";
      function reload() {draw(0);room.classList.remove("blow");busy=false;}
      if(reduced()){reload();return;}
      room.classList.add("blow");
      const anim=sheet.animate([{transform:getComputedStyle(sheet).transform,opacity:1},
        {transform:"translate(18%,-24%) rotate(8deg)",opacity:1,offset:.58},
        {transform:"translate(39%,-44%) rotate(15deg)",opacity:0}],{duration:710,easing:"cubic-bezier(.18,.68,.35,1)"});
      anim.onfinish=()=>{reload();sheet.animate([{opacity:0,transform:"translate(-1%,3%)"},{opacity:1,transform:"none"}],{duration:230});};
    }
    pull(byId("grip"),()=>p,(start,dy)=>{if(!busy)draw(start-dy/Math.max(55,unit.clientHeight*.28));},
      (_,dy,cancel)=>{if(!busy && !cancel && dy<-12)release();else if(!busy)draw(0)},release);
    byId("pluck").onclick=release;
  }

  if(key==="monkey"){
    root.innerHTML='<section id="play-studio" aria-label="猴山磁吸互动"></section>';
    // play.js mounts the existing original seven-socket installation after this script.
  } else if(key==="cabinet") cabinet();
  else if(key==="beasts") beasts();
  else dufu();
})();
