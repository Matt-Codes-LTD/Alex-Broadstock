// assets/v1/sections/home-hero/video-manager.js
import { prefersReducedMotion, prefersReducedData } from "./utils.js";

export function createVideoManager(stage) {
  const videoBySrc = new Map();
  let activeVideo = null, activeLink = null;
  let transitionInProgress = false;

  function createVideo(src) {
    if (!src) return null;
    let v = videoBySrc.get(src);
    if (v) return v;

    v = document.createElement("video");
    v.className = "home-hero_video_el";
    v.src = src;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    gsap.set(v, { opacity: 0, transformOrigin: "50% 50%" });
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
    v.readyState >= 2 ? start() : v.addEventListener("canplaythrough", start, { once: true });
  }

  const fadeTargetsFor = (link) => {
    const defaultFadeSel = ".home-category_ref_text, .home-hero_title, .home-hero_name, .home-hero_heading";
    return (link?.querySelectorAll(link.getAttribute("data-fade-target") || defaultFadeSel) || []);
  };

  function updateLinkState(prev, next) {
    if (prev && prev !== next) {
      prev.setAttribute("aria-current", "false");
      fadeTargetsFor(prev).forEach(n => n.classList.add("u-color-faded"));
    }
    if (next) {
      next.setAttribute("aria-current", "true");
      fadeTargetsFor(next).forEach(n => n.classList.remove("u-color-faded"));
    }
  }

  function restart(v) {
    try { "fastSeek" in v ? v.fastSeek(0) : (v.currentTime = 0); v.play?.(); } catch {}
  }

  const whenReady = (v) => new Promise(res => {
    if (v.readyState >= 2) return res();
    const on = () => { v.removeEventListener("loadeddata", on); v.removeEventListener("canplay", on); res(); };
    v.addEventListener("loadeddata", on, { once: true });
    v.addEventListener("canplay", on, { once: true });
    setTimeout(on, 1000);
  });

  async function seekTo(v, t) {
    await new Promise(res => {
      if (v.readyState >= 1) return res();
      v.addEventListener("loadedmetadata", res, { once: true });
      setTimeout(res, 500);
    });
    try {
      const dur = v.duration || 0;
      let target = Math.max(0, Math.min(Number.isFinite(dur) && dur > 0 ? dur - 0.05 : t, t));
      v.currentTime = target;
    } catch {}
    return v;
  }

  function onFirstRenderedFrame(v, cb) {
    if ("requestVideoFrameCallback" in v) {
      // @ts-ignore
      v.requestVideoFrameCallback(() => cb());
    } else {
      const h = () => { v.removeEventListener("timeupdate", h); cb(); };
      v.addEventListener("timeupdate", h, { once: true });
      setTimeout(cb, 120); // safety
    }
  }

  function setActive(src, linkEl, opts = {}) {
    if (transitionInProgress) return;

    const next = videoBySrc.get(src) || createVideo(src);
    if (!next) return;

    next.__keepAlive = true;
    if (activeVideo && activeVideo !== next) activeVideo.__keepAlive = false;

    // Same video, just update link
    if (next === activeVideo) {
      if (linkEl && linkEl !== activeLink) {
        updateLinkState(activeLink, linkEl);
        activeLink = linkEl;
      }
      return;
    }

    transitionInProgress = true;
    const previousVideo = activeVideo;
    activeVideo = next;

    // options
    const mode        = opts.mode || "tween";     // "instant" | "tween"
    const fromScale   = opts.tweenFromScale ?? 1.03;
    const tweenDur    = opts.tweenDuration  ?? 0.7;
    const tweenEase   = opts.tweenEase      ?? "power3.out";

    const tl = gsap.timeline({
      onComplete: () => {
        transitionInProgress = false;
        if (previousVideo) {
          previousVideo.classList.remove("is-active");
          setTimeout(() => { if (!previousVideo.__keepAlive) previousVideo.pause?.(); }, 100);
        }
      }
    });

    const playNew = async () => {
      await whenReady(next);
      if (opts.startAt != null) {
        await seekTo(next, Math.max(0, opts.startAt));
        await next.play().catch(() => {});
      } else {
        restart(next);
      }
    };

    if (mode === "instant" || prefersReducedMotion) {
      // Immediate switch with first-frame sync — no fade/scale
      if (previousVideo) { previousVideo.classList.remove("is-active"); gsap.set(previousVideo, { opacity: 0, scale: 1 }); }
      next.classList.add("is-active");
      gsap.set(next, { opacity: 1, scale: 1, transformOrigin: "50% 50%" });
      playNew().then(() => onFirstRenderedFrame(next, () => opts.onVisible?.()));
      transitionInProgress = false;
    } else {
      // Gentle crossfade + micro-settle
      const prepare = async () => {
        await playNew();
        next.classList.add("is-active");

        if (previousVideo) {
          gsap.set(next, { opacity: 0, scale: fromScale, transformOrigin: "50% 50%" });
          gsap.set(previousVideo, { opacity: 1, scale: 1, transformOrigin: "50% 50%" });

          tl.to(previousVideo, { opacity: 0, scale: 1, duration: tweenDur * 0.86, ease: "power2.out" }, 0)
            .to(next, {
              opacity: 1, scale: 1, duration: tweenDur, ease: tweenEase,
              onComplete: () => { opts.onVisible?.(); }
            }, 0.06);
        } else {
          gsap.set(next, { opacity: 0, scale: fromScale, transformOrigin: "50% 50%" });
          tl.to(next, {
            opacity: 1, scale: 1, duration: tweenDur * 0.86, ease: tweenEase,
            onComplete: () => { opts.onVisible?.(); }
          });
        }
      };
      if (next.readyState >= 2) prepare(); else setTimeout(prepare, 0);
    }

    if (linkEl && linkEl !== activeLink) {
      updateLinkState(activeLink, linkEl);
      activeLink = linkEl;
    }
  }

  function preloadNext(currentSrc) {
    const videos = Array.from(videoBySrc.keys());
    const currentIndex = videos.indexOf(currentSrc);
    const nextSrc = videos[currentIndex + 1] || videos[0];
    if (nextSrc) {
      const nextVideo = videoBySrc.get(nextSrc);
      if (nextVideo && !nextVideo.__warmed) warmVideo(nextVideo);
    }
  }

  return {
    createVideo,
    warmVideo,
    setActive: (src, linkEl, opts) => { setActive(src, linkEl, opts); preloadNext(src); },
    get activeLink() { return activeLink; },
    get activeVideo() { return activeVideo; }
  };
}
