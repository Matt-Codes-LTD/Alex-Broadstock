// split-character-text.js (home hover pre-warm) → modular
(function () {
  window.App = window.App || {};
  const NS = (window.App.splitChars = window.App.splitChars || {});

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
    const wrap = root.querySelector(".home-hero_wrap");
    if (!wrap || wrap.dataset.simpleWarmInit) return;
    wrap.dataset.simpleWarmInit = "1";

    let last = null;
    async function warm(url) {
      if (!url || url === last) return;
      last = url;
      try {
        const v = document.createElement("video");
        v.src = url;
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.crossOrigin = "anonymous";
        await new Promise(res => {
          const done = () => res();
          v.addEventListener("loadeddata", done, { once: true });
          v.addEventListener("canplaythrough", done, { once: true });
          v.addEventListener("error", done, { once: true });
          setTimeout(done, 2500);
        });
        try { await v.play()?.catch(()=>{}); setTimeout(() => v.pause(), 30); } catch {}
      } catch {}
    }

    function setFades(item) {
      wrap.querySelectorAll(".home-hero_link")
        .forEach(link => link.querySelectorAll(".home_hero_text, .home-category_ref_text")
          .forEach(el => el.classList.add("u-color-faded")));
      if (item) {
        item.querySelectorAll(".home_hero_text, .home-category_ref_text")
          .forEach(el => el.classList.remove("u-color-faded"));
      }
    }

    const onEnter = (ev) => {
      const link = ev.target.closest?.(".home-hero_link");
      if (!link) return;
      const url = link.getAttribute("data-video-main") || link.getAttribute("data-video");
      if (url) { preconnect(url); warm(url); }
      setFades(link);
    };

    wrap.addEventListener("pointerover", onEnter, { passive: true });
    wrap.addEventListener("focusin", onEnter);

    const current = wrap.querySelector('.home-hero_link[aria-current="true"]') || wrap.querySelector(".home-hero_link");
    if (current) setFades(current);
  }

  NS.init = init;
  NS.destroy = () => {}; // listeners are on the container and removed with it

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
