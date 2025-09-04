// project.js (player) → modular
(function () {
  window.App = window.App || {};
  const NS = (window.App.project = window.App.project || {});
  const state = new WeakMap(); // store per-section listeners

  function preconnect(url) {
    try {
      const { origin } = new URL(url, location.href);
      const head = document.head;
      const exists = [...head.querySelectorAll('link[rel="preconnect"],link[rel="dns-prefetch"]')]
        .some(l => (l.href || "").startsWith(origin));
      if (!exists) {
        const pc = document.createElement("link");
        pc.rel = "preconnect";
        pc.href = origin;
        pc.crossOrigin = "anonymous";
        head.appendChild(pc);
        const dp = document.createElement("link");
        dp.rel = "dns-prefetch";
        dp.href = origin;
        head.appendChild(dp);
      }
    } catch {}
  }

  function init(root = document) {
    const wrap = root.querySelector(".project-player_wrap");
    if (!wrap || wrap.dataset.jsInit) return;
    wrap.dataset.jsInit = "1";

    const video = wrap.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.autoplay = true;
    video.play?.().catch(() => {});
    preconnect(video.currentSrc || video.src);

    // idle logic (scoped to wrap)
    let idleT;
    const makeActive = () => {
      wrap.dataset.idle = "0";
      clearTimeout(idleT);
      idleT = setTimeout(() => (wrap.dataset.idle = "1"), 3000);
    };
    const evs = ["mousemove", "keydown", "click", "touchstart"];
    evs.forEach(ev => wrap.addEventListener(ev, makeActive, { passive: true }));
    makeActive();

    state.set(wrap, { idleT, evs, makeActive });
  }

  function destroy(root = document) {
    const wrap = root.querySelector(".project-player_wrap");
    if (!wrap) return;
    const s = state.get(wrap);
    if (s) {
      s.evs.forEach(ev => wrap.removeEventListener(ev, s.makeActive));
      clearTimeout(s.idleT);
      state.delete(wrap);
    }
    delete wrap.dataset.jsInit;
  }

  NS.init = init;
  NS.destroy = destroy;

  // direct-load support
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
