(() => {
  "use strict";
  const buttons = [...document.querySelectorAll("[data-music]")];
  if (!buttons.length) return;

  // Resolve relative to this site even when a case link has changed the location.
  const source = new URL("media/quiet-strings.mp3", document.currentScript?.src || location.href).href;
  let player = null;
  let enabled = false;
  let away = false;
  let request = 0;

  function paint(error = "") {
    const label = error || (enabled ? "暂停背景音乐" : "播放背景音乐");
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(enabled));
      button.setAttribute("aria-label", label);
      button.title = label;
      const copy = button.querySelector(".music-label");
      if (copy) copy.textContent = error ? "播放失败" : enabled ? "暂停音乐" : "音乐";
    }
  }

  function track() {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "none";
    audio.src = source;
    audio.addEventListener("error", () => {
      if (audio !== player || !enabled) return;
      enabled = false;
      ++request;
      paint("音乐未能载入，点按重试");
    });
    return audio;
  }

  async function sync() {
    const version = ++request;
    if (!enabled || document.hidden || away) {
      player?.pause();
      return;
    }
    try {
      if (!player || player.error) player = track();
      await player.play();
    } catch {
      // Visibility changes and repeated toggles legitimately interrupt play().
      if (version !== request) return;
      enabled = false;
      paint("音乐未能播放，点按重试");
    }
  }

  buttons.forEach(button => button.addEventListener("click", () => {
    enabled = !enabled;
    paint();
    sync();
  }));
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", () => { away = true; sync(); });
  window.addEventListener("pageshow", () => { away = false; sync(); });
  paint();
})();
