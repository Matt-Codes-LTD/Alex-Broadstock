// assets/v1/sections/site-loader/index.js
export default function initSiteLoader(container) {
  if (window.__barbaNavigated) {
    console.log("[SiteLoader] Skipping - Barba navigation");
    return () => {};
  }

  console.log("[SiteLoader] init");

  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return () => {};
  loaderEl.dataset.scriptInitialized = "true";

  // Lock scroll
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);

  // Elements
  const progressText = loaderEl.querySelector(".site-loader_progress-text");
  const fpsCounter   = loaderEl.querySelector(".site-loader_fps-counter");
  const edgesBox     = loaderEl.querySelector(".site-loader_edges");
  const corners      = loaderEl.querySelectorAll(".site-loader_corner");

  // Viewport base for responsive units
  const vwScreen = window.innerWidth <= 479 ? 479 :
                   window.innerWidth <= 767 ? 767 :
                   window.innerWidth <= 991 ? 991 : 1920;

  // Video dims (px)
  const videoWidth  = 349 * (window.innerWidth / vwScreen);
  const videoHeight = 198 * (window.innerWidth / vwScreen);

  // Loader video wrapper + video
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  gsap.set(videoWrapper, {
    position: "fixed",
    width: videoWidth,
    height: videoHeight,
    left: "50%", top: "50%", xPercent: -50, yPercent: -50,
    zIndex: 1, opacity: 0, overflow: "hidden"
  });

  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;

  const video = document.createElement("video");
  video.style.cssText = "width:100%;height:100%;object-fit:cover;";
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto"; video.crossOrigin = "anonymous";
  if (firstVideoUrl) {
    video.src = firstVideoUrl;
    console.log("[SiteLoader] Using video:", firstVideoUrl);
  }
  videoWrapper.appendChild(video);

  // Curtain
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  gsap.set(videoCurtain, {position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"#020202"});
  videoWrapper.appendChild(videoCurtain);

  // Insert
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  const edgesBoxEl = loaderEl.querySelector(".site-loader_edges");
  if (edgesBoxEl) edgesBoxEl.parentNode.insertBefore(videoWrapper, edgesBoxEl);
  else loaderContainer.appendChild(videoWrapper);

  // Hide hero during loader
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 0, transform: "none !important", scale: "1 !important" });

  // Ease
  gsap.registerEase("custom2InOut", p => (p < 0.5 ? 2*p*p : 1 - ((-2*p + 2)**2)/2));

  // State
  let progress = { value: 0, fps: 24 };

  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, { "--sl-width": 67, "--sl-height": 67 });

  // Resume handler + fallback
  let heroResumeTimeout = null;
  const onHeroReadyForReveal = () => {
    tl.play(); // resume from pause
  };
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });

  // Main timeline
  const tl = gsap.timeline({
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
    }
  });

  // Phase 1: Progress
  tl.to(progress, {
    value: 1, fps: 120, duration: 3, ease: "sine.inOut",
    onUpdate: () => {
      const pct = Math.round(progress.value * 100);
      if (progressText) progressText.textContent = pct.toString().padStart(2, "0");
      if (edgesBox) {
        const width = Math.round(67 + (371 - 67) * progress.value);
        const height = Math.round(67 + (220 - 67) * progress.value);
        gsap.set(edgesBox, { "--sl-width": width, "--sl-height": height });
      }
      if (fpsCounter) fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
    },
    onComplete: () => {
      if (video) { video.currentTime = 0.001; video.play().catch(() => {}); }
    }
  })
  // Phase 2: Fade text
  .to(progressText, { opacity: 0, duration: 0.3 })
  // Phase 3: Video reveal
  .to(videoWrapper, { opacity: 1, duration: 0.3, ease: "power2.out" })
  .to(videoCurtain, { xPercent: 100, duration: 1.6, ease: "custom2InOut" })
  .to(video, { scale: 1.2, duration: 1.6, ease: "custom2InOut" }, "<")
  // Phase 4: Fade UI elements
  .to([corners, fpsCounter], { opacity: 0, duration: 0.6, stagger: 0.02 })
  .to(edgesBox, { opacity: 0, scale: 1.5, duration: 0.7, ease: "power3.inOut" }, "<0.024")
  // Phase 5: Scale to fullscreen center → then snap to (0,0)
  .to(video, { scale: 1, duration: 0.8, ease: "power2.inOut" })
  .to(videoWrapper, { width: window.innerWidth, height: window.innerHeight, duration: 1.8, ease: "power3.inOut" }, "<")
  .to(videoWrapper, { xPercent: 0, yPercent: 0, left: 0, top: 0, duration: 0.3, ease: "power2.inOut" })
  // Phase 6: Handoff (dispatch details + WAIT for hero)
  .call(() => {
    if (heroVideoContainer) {
      gsap.set(heroVideoContainer, { opacity: 1, zIndex: 0 }); // show hero behind
      const detail = {
        src: firstVideoUrl || null,
        currentTime: video?.currentTime || 0,
        duration: video?.duration || 0
      };
      window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
      // safety fallback in case hero never replies
      heroResumeTimeout = setTimeout(onHeroReadyForReveal, 1500);
    }
  })
  .addPause("await-hero-ready") // ← wait here until hero says “ready”
  // Phase 7: Bring in hero UI and fade out loader
  .to(heroContent, { visibility: "visible", opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" })
  .to(loaderEl, { opacity: 0, duration: 0.5 }, "-=0.5")
  .call(() => { window.dispatchEvent(new CustomEvent("siteLoaderComplete")); });

  // Play after min time
  tl.pause();
  setTimeout(() => tl.play(), 2000);

  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    window.removeEventListener("homeHeroReadyForReveal", onHeroReadyForReveal);
    if (heroResumeTimeout) clearTimeout(heroResumeTimeout);
    delete loaderEl.dataset.scriptInitialized;
  };
}
