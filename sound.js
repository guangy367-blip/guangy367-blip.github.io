(() => {
  "use strict";
  const controls = [...document.querySelectorAll("[data-music]")];
  if (!controls.length) return;
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("music-player.css?v=river2",document.currentScript?.src || location.href).href;
  document.head.append(style);

  const song = "https://music.163.com/song?id=32743519";
  // The platform's own external player handles audio and regional playback permissions.
  const embed = "https://music.163.com/outchain/player?type=2&id=32743519&auto=1&height=66";
  const player = document.createElement("section");
  player.id = "official-song";
  player.className = "official-song";
  player.setAttribute("aria-label","江上清风游 · 变奏的梦想，网易云音乐播放器");
  player.tabIndex = -1;
  player.hidden = true;
  player.innerHTML = '<header><a class="song-source" target="_blank" rel="noopener noreferrer">《江上清风游》 · 变奏的梦想 <span aria-hidden="true">↗</span></a><button class="song-compact" type="button" aria-label="收起音乐播放器，继续播放">收起</button><button type="button" class="song-stop">停止</button></header><div class="song-frame"></div><div class="song-mini" hidden><button class="song-reveal" type="button" aria-label="展开《江上清风游》播放器" title="展开音乐播放器"><span aria-hidden="true">♫</span></button><button type="button" class="song-stop">停止</button></div>';
  player.querySelector("a").href = song;
  document.body.append(player);
  const host = player.querySelector(".song-frame");
  const header = player.querySelector("header");
  const mini = player.querySelector(".song-mini");
  const reveal = mini.querySelector(".song-reveal");
  let opener = null;

  function paint(compact = false) {
    player.classList.toggle("is-compact",compact);
    header.hidden = compact;
    mini.hidden = !compact;
    host.inert = compact;
    host.setAttribute("aria-hidden",String(compact));
    for (const control of controls) {
      control.removeAttribute("aria-pressed");
      control.setAttribute("aria-controls",player.id);
      control.setAttribute("aria-expanded",String(!player.hidden && !compact));
      const label = player.hidden ? "打开《江上清风游》官方播放器" : compact ? "展开《江上清风游》播放器" : "收起音乐播放器，继续播放";
      control.setAttribute("aria-label",label);
      control.title = label;
      const copy = control.querySelector(".music-label");
      if (copy) copy.textContent = player.hidden || compact ? "音乐" : "收起音乐";
    }
  }
  function stop(restoreFocus = false) {
    if (player.hidden) return;
    player.hidden = true;
    host.replaceChildren();
    paint();
    if (restoreFocus && opener?.isConnected) opener.focus({preventScroll:true});
    opener = null;
  }
  function collapse() {
    paint(true);
    reveal.focus({preventScroll:true});
  }
  function open(control) {
    if (player.hidden) {
      opener = control;
      const frame = document.createElement("iframe");
      frame.title = "网易云音乐 · 江上清风游 · 变奏的梦想";
      frame.width = "330";
      frame.height = "86";
      frame.allow = "autoplay; encrypted-media";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.src = embed;
      host.append(frame);
      player.hidden = false;
    }
    paint();
    player.focus({preventScroll:true});
  }
  controls.forEach(control => control.addEventListener("click",() => {
    if (player.hidden || player.classList.contains("is-compact")) open(control);
    else collapse();
  }));
  player.querySelector(".song-compact").addEventListener("click",collapse);
  reveal.addEventListener("click",() => open(opener));
  player.querySelectorAll(".song-stop").forEach(button => button.addEventListener("click",() => stop(true)));
  document.addEventListener("keydown",event => {
    if (event.key==="Escape" && !player.hidden && !player.classList.contains("is-compact") && !document.querySelector("dialog[open]")) collapse();
  });
  // Keep the player's state as the visitor reads, switches tabs, or minimizes it.
  // Actual navigation and the explicit stop control release the cross-origin player.
  window.addEventListener("pagehide",() => stop());
  paint();
})();
