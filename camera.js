(() => {
  const cover = document.querySelector(".folio-cover");
  if (!cover) return;
  const art = cover.querySelector(".cover-art");
  const controls = Array.from(cover.querySelectorAll("[data-lens]"));
  const names = {whole:"全景", angle:"斜向", knot:"绳结特写"};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(pointer: fine)");
  let index = 0, pending = 0, dx = 0, dy = 0;

  function select(next) {
    index = (next + controls.length) % controls.length;
    const lens = controls[index].dataset.lens;
    if (lens === "knot") {
      // Once a close‐up is requested, the small screen can reveal the fibres
      // at the original desktop resolution, using the same registered image.
      const source = art.querySelector("source");
      if (source) source.srcset = "media/hero-cover.webp";
    }
    controls.forEach((b,i) => b.setAttribute("aria-pressed", String(i === index)));
    cover.dataset.camera = lens;
    cover.querySelector(".camera-reader").textContent = "当前视角为" + names[lens];
    art.setAttribute("aria-label","当前为" + names[lens] + "，切换至" + names[controls[(index+1)%controls.length].dataset.lens]);
  }
  controls.forEach((b,i) => {
    b.addEventListener("click",() => select(i));
    b.addEventListener("keydown",e => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Home") select(0);
      if (e.key === "End") select(controls.length-1);
      if (e.key.startsWith("Arrow")) select(i + (e.key === "ArrowLeft" ? -1 : 1));
      controls[index].focus({preventScroll:true});
    });
  });
  art.addEventListener("click",() => select(index + 1));
  function paint() {
    pending = 0;
    art.style.setProperty("--point-x", (dx * 10).toFixed(2) + "px");
    art.style.setProperty("--point-y", (dy * 6).toFixed(2) + "px");
    art.style.setProperty("--point-r", (dx * 4.5).toFixed(2) + "deg");
    art.style.setProperty("--point-p", (-dy * 3).toFixed(2) + "deg");
  }
  function queue(){ if(!pending) pending=requestAnimationFrame(paint); }
  cover.addEventListener("pointermove",e => {
    if (e.pointerType !== "mouse" || !fine.matches || reduced.matches) return;
    const bounds = cover.getBoundingClientRect();
    dx = (e.clientX - bounds.left) * 2 / bounds.width - 1;
    dy = (e.clientY - bounds.top) * 2 / bounds.height - 1;
    queue();
  },{passive:true});
  cover.addEventListener("pointerleave",() => {dx=0;dy=0;queue();});
})();
