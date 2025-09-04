window.splitInit = () => {
  const wrap = document.querySelector(".home-hero_wrap");
  if (!wrap || wrap.dataset.splitInit) return;
  wrap.dataset.splitInit = "1";

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
        setTimeout(done, 2000);
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
    if (url) warm(url);
    setFades(link);
  };

  wrap.addEventListener("pointerover", onEnter, { passive: true });
  wrap.addEventListener("focusin", onEnter);

  const current = wrap.querySelector('.home-hero_link[aria-current="true"]') || wrap.querySelector(".home-hero_link");
  if (current) setFades(current);
};
