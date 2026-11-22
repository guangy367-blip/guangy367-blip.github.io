(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const key = new URLSearchParams(location.search).get("p") || "monkey";
  const catalog = window.catalog || {};
  const work = Object.hasOwn(catalog, key) ? catalog[key] : null;
  if (!work || !Array.isArray(work.sections) || !work.sections.length) {
    $("missing").hidden = false;
    return;
  }

  document.title = work.title + " · 文化与日常";
  $("title").textContent = work.title;
  $("english").textContent = work.english || "";
  $("category").textContent = work.category;
  $("intro").textContent = work.intro;
  $("cover").alt = work.title + "作品实景";
  $("cover").src = "media/card-" + key + ".webp";
  const order = ["monkey", "cabinet", "beasts", "dufu"].filter((id) => catalog[id]);
  const next = order[(order.indexOf(key) + 1) % order.length];
  $("next-case").href = "case.html?p=" + next;
  $("next-cover").src = "media/card-" + next + ".webp";
  $("next-title").textContent = catalog[next].title;

  const pages = [];
  const chapters = [];
  const chapterSelect = $("mobile-chapters");
  const gallery = $("viewer");
  const viewport = $("viewport");
  const plate = $("plate");
  let selectedPlate = -1;
  let currentChapter = -1;
  let detail = false;
  let opener;
  const reduced = window.matchMedia("(prefers-reduced-motion:reduce)");

  function setChapter(index) {
    if (index === currentChapter) return;
    if (currentChapter >= 0) chapters[currentChapter].link.removeAttribute("aria-current");
    currentChapter = index;
    const chosen = chapters[index];
    chosen.link.setAttribute("aria-current", "location");
    chapterSelect.value = chosen.element.id;
  }

  function makePlate(info, chapterTitle) {
    const image = document.createElement("img");
    image.loading = "lazy";
    image.decoding = "async";
    image.width = info.w;
    image.height = info.h;
    image.alt = info.alt || chapterTitle;
    if (info.small && info.w > 720) {
      image.srcset = info.small + " 720w, " + info.src + " " + info.w + "w";
      image.sizes = "(max-width:660px) 92vw, (max-width:850px) 68vw, (min-width:1920px) 1296px, 68vw";
    }
    image.src = info.src;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "plate-thumb";
    button.setAttribute("aria-label", "放大查看" + image.alt);
    button.setAttribute("aria-haspopup", "dialog");
    const index = pages.length;
    pages.push({info, chapterTitle, button});
    button.addEventListener("click", () => openPlate(index));
    button.append(image);
    return button;
  }

  for (const [i, section] of work.sections.entries()) {
    const element = document.createElement("section");
    element.id = "chapter-" + (i + 1);
    element.className = "chapter";
    const title = document.createElement("h2");
    title.textContent = section.title;
    const images = document.createElement("div");
    images.className = "plates";
    for (const info of section.images) images.append(makePlate(info, section.title));
    element.append(title, images);
    $("pages").append(element);

    const link = document.createElement("a");
    link.href = "#" + element.id;
    link.textContent = section.title;
    $("chapters").append(link);
    chapterSelect.add(new Option(section.title, element.id));
    chapters.push({element, link});
  }
  chapterSelect.addEventListener("change", () => {
    const anchor = "#" + chapterSelect.value;
    if (location.hash === anchor) $(chapterSelect.value).scrollIntoView();
    else location.hash = anchor;
  });
  $("case-main").hidden = false;
  if ("IntersectionObserver" in window && !reduced.matches) {
    const entryObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("arrive");
        observer.unobserve(entry.target);
      }
    }, {rootMargin:"0px 0px -4% 0px"});
    chapters.forEach(({element}) => entryObserver.observe(element));
  }
  let scheduled = false;
  function readPosition() {
    scheduled = false;
    const edge = Math.min(innerHeight * 0.21, 178);
    let active = 0;
    for (let i = 1; i < chapters.length; i++) {
      if (chapters[i].element.getBoundingClientRect().top > edge) break;
      active = i;
    }
    setChapter(active);
  }
  function scheduleRead() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(readPosition);
  }
  window.addEventListener("scroll", scheduleRead, {passive:true});
  window.addEventListener("resize", scheduleRead, {passive:true});
  window.addEventListener("pageshow", scheduleRead);
  readPosition();
  if (/^#chapter-\d+$/.test(location.hash)) {
    requestAnimationFrame(() => $(location.hash.slice(1))?.scrollIntoView({behavior:"instant"}));
  }

  function setDetail(enabled, focusPoint) {
    detail = enabled;
    viewport.classList.toggle("detail", enabled);
    const zoomButton = $("zoom");
    zoomButton.textContent = enabled ? "适应屏幕" : "放大细看";
    zoomButton.setAttribute("aria-pressed", String(enabled));
    if (enabled) {
      const info = pages[selectedPlate].info;
      const fit = Math.min(viewport.clientWidth / info.w, viewport.clientHeight / info.h);
      const zoomWidth = Math.max(info.w, Math.round(info.w * fit * 1.75));
      viewport.style.setProperty("--plate-width", zoomWidth + "px");
      // Synchronize with actual zoom layout so the tapped artwork detail
      // stays in view even when one axis is letterboxed.
      const point = focusPoint || {x:.5, y:.5};
      viewport.scrollLeft = plate.offsetLeft - viewport.offsetLeft + plate.clientWidth * point.x - viewport.clientWidth / 2;
      viewport.scrollTop = plate.offsetTop - viewport.offsetTop + plate.clientHeight * point.y - viewport.clientHeight / 2;
    } else {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
    }
  }

  function displayPlate(index) {
    if (index < 0 || index >= pages.length) return;
    const nextDirection = index >= selectedPlate ? 1 : -1;
    selectedPlate = index;
    const {info,chapterTitle} = pages[index];
    plate.width = info.w;
    plate.height = info.h;
    plate.alt = info.alt || chapterTitle;
    plate.src = info.src;
    $("plate-name").textContent = work.title + " / " + chapterTitle;
    $("count").textContent = (index + 1) + " / " + pages.length;
    $("prev-plate").disabled = index === 0;
    $("next-plate").disabled = index === pages.length - 1;
    setDetail(false);
    if (!reduced.matches && plate.animate) {
      const expected = plate.src;
      plate.decode().then(() => {
        if (!gallery.open || selectedPlate !== index || plate.src !== expected || detail) return;
        plate.animate([
          {opacity:.52,transform:"translateX(" + nextDirection * 14 + "px)"},
          {opacity:1,transform:"translateX(0)"}
        ],{duration:290,easing:"cubic-bezier(.18,.65,.25,1)"});
      }).catch(() => {});
    }
  }

  function openPlate(index) {
    opener = pages[index].button;
    displayPlate(index);
    gallery.showModal();
    document.body.classList.add("modal-open");
    $("close-viewer").focus({preventScroll:true});
  }
  $("prev-plate").addEventListener("click", () => displayPlate(selectedPlate - 1));
  $("next-plate").addEventListener("click", () => displayPlate(selectedPlate + 1));
  $("close-viewer").addEventListener("click", () => gallery.close());
  $("zoom").addEventListener("click", () => setDetail(!detail));
  gallery.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    plate.removeAttribute("src");
    opener?.focus({preventScroll:true});
  });
  gallery.addEventListener("keydown", (event) => {
    if (detail || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      displayPlate(selectedPlate + (event.key === "ArrowLeft" ? -1 : 1));
    }
  });
  plate.addEventListener("click", (event) => {
    if (detail) {
      setDetail(false);
      return;
    }
    const {w,h} = pages[selectedPlate].info;
    const box = plate.getBoundingClientRect();
    const s = Math.min(box.width / w, box.height / h);
    const rx = (event.clientX - box.left - (box.width - w * s) / 2) / (w * s);
    const ry = (event.clientY - box.top - (box.height - h * s) / 2) / (h * s);
    if (rx >= 0 && rx <= 1 && ry >= 0 && ry <= 1) setDetail(true, {x:rx,y:ry});
  });
})();
