(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (!("IntersectionObserver" in window) || !CSS.supports("translate", "0 1px")) return;

  function mount() {
    if (reduced.matches) return;
    const sections = "#works,#journey,#profile,#honors,#channels";
    // Observe each beat at its own place on the page. The image and its
    // caption can be side by side on desktop and several screens apart on mobile.
    const parts = {
      title: "#works .section-head > div:first-child, #journey .cm-head > div:first-child, #honors .honor-heading > div:first-child, #channels .section-head",
      art:   "#works .proof-pile, #journey .cm-panel:not([hidden]) .cm-art, #profile .portrait",
      note:  "#works .proof-copy, #journey .cm-panel:not([hidden]) .cm-copy, #profile .bio dl, #honors .honor-records",
      line:  "#works .view-switch, #journey .cm-tabs, #honors .honor-switch, #channels .channel-link"
    };
    const pending = new Set();
    const observer = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting || !pending.has(e.target)) continue;
        observer.unobserve(e.target);
        e.target.dataset.approach = "arriving";
      }
    }, {rootMargin:"0px 0px 0px 0px"});

    function finish(el) {
      if (!pending.delete(el)) return;
      observer.unobserve(el);
      delete el.dataset.approach;
      delete el.dataset.entrance;
      if (!pending.size) observer.disconnect();
    }
    function finishSection(subject) {
      const container = subject?.closest(sections);
      if (!container) return;
      for (const el of pending) if (container.contains(el)) finish(el);
    }
    function finishVisible() {
      for (const el of pending) {
        const r = el.getBoundingClientRect();
        if (r.height && r.top < innerHeight + 80 && r.bottom > -80) finish(el);
      }
    }
    function finishHash(hash) {
      if (hash?.startsWith("#")) {
        try { finishSection(document.getElementById(decodeURIComponent(hash.slice(1)))); }
        catch { /* A malformed external fragment has no in-page target. */ }
      }
    }
    for (const [kind, selectors] of Object.entries(parts)) {
      for (const el of document.querySelectorAll(selectors)) {
        const r = el.getBoundingClientRect();
        if (!r.height || r.top < innerHeight) continue;
        el.dataset.entrance = kind;
        el.dataset.approach = "waiting";
        pending.add(el);
        observer.observe(el);
      }
    }
    // Cleanup on the element's own animation only. Its descendants often
    // have hover and paging animations whose events bubble through it.
    function ended(e) {
      if (e.animationName === "folio-arrival") finish(e.target);
    }
    document.addEventListener("animationend", ended);
    document.addEventListener("animationcancel", ended);
    // Commit the final positions before pointer hit testing or keyboard
    // activation of the artwork, so a drag never starts on moving coordinates.
    const interactive = "a[href],button,input,select,summary,.proof-pile,.cm-art";
    function settleControl(e) {
      if (e.target.closest(interactive) || (e.type==="focusin" && e.target.matches("[tabindex='0']"))) {
        finishSection(e.target);
      }
    }
    document.addEventListener("pointerdown",settleControl,{capture:true, passive:true});
    document.addEventListener("focusin",settleControl);
    let internalDestination = "";
    document.addEventListener("click",e => {
      const link=e.target.closest("a[href^='#']");
      if (link && !e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        internalDestination = link.hash !== location.hash ? link.hash : "";
      }
    });
    finishHash(location.hash);
    window.addEventListener("hashchange",()=>{
      // A local index link is another entrance. History traversals and direct
      // fragments restore users to their reading position immediately.
      if(location.hash!==internalDestination) {
        finishHash(location.hash);
        finishVisible();
      }
      internalDestination="";
    });
    window.addEventListener("pageshow",e=>{
      if (e.persisted) finishVisible();
    });
    reduced.addEventListener("change",()=>{if (reduced.matches) [...pending].forEach(finish);});
  }
  // Other deferred scripts mount the paper stack, commission tabs and
  // honors list. Run after all DOMContentLoaded callbacks, in either order.
  if (document.readyState==="complete" || document.querySelector("#works .proof-table")) mount();
  else document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,0),{once:true});
})();
