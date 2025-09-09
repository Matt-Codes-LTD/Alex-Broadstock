// video-manager.js
export function createVideoManager(stage, prefersReducedMotion, prefersReducedData) {
  const videoBySrc = new Map();
  let activeVideo = null;

  function createVideo(src) {
    if (!src) return null;
    let v = videoBySrc.get(src);
    if (v) return v;
    v = document.createElement("video");
    v.className = "home-hero_video_el";
    v.src = src;
    v.muted = true; v.loop = true; v.playsInline = true;
    v.preload = "auto"; v.crossOrigin = "anonymous";
    stage.appendChild(v);
    videoBySrc.set(src, v);
    return v;
  }

  function warmVideo(v) {
    if (!v || v.__warmed || prefersReducedData) return;
    v.__warmed = true;
    const start = () => {
      v.play().then(() => {
        setTimeout(() => { if (!v.__keepAlive) v.pause?.(); }, 250);
      }).catch(() => {});
    };
    v.readyState >= 2
      ? start()
      : v.addEventListener("canplaythrough", start, { once: true });
  }

  function restart(v) {
    try { "fastSeek" in v ? v.fastSeek(0) : (v.currentTime = 0); v.play?.(); } catch {}
  }

  function setActive(src, linkEl) {
    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;
    next.__keepAlive = true;
    if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;

    if (next !== activeVideo) {
      activeVideo?.classList.remove("is-active");
      next.classList.add("is-active");
      activeVideo = next;
    }

    // Active link state is managed outside (state.js via index.js)
    if (!prefersReducedMotion) restart(next);
  }

  return { createVideo, warmVideo, setActive };
}
