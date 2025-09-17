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

  // Loader chrome
  const progressText = loaderEl.querySelector(".site-loader_progress-text");
  const fpsCounter   = loaderEl.querySelector(".site-loader_fps-counter");
  const edgesBox     = loaderEl.querySelector(".site-loader_edges");
  const corners      = loaderEl.querySelectorAll(".site-loader_corner");
  const curtainEl    = loaderEl.querySelector(".site-loader_curtain");

  // Hero area
  const heroVideoContainer = container.querySelector(".home-hero_video");
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");

  // Hide hero content (not the video)
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 1, zIndex: 0 });

  // Sizing baseline
  const vwScreen = window.innerWidth <= 479 ? 479 :
                   window.innerWidth <= 767 ? 767 :
                   window.innerWidth <= 991 ? 991 : 1920;

  const initialVideoWidth  = 349 * (window.innerWidth / vwScreen);
  const initialVideoHeight = 198 * (window.innerWidth / vwScreen);

  // Ease
  gsap.registerEase("custom2InOut", p => (p < 0.5 ? 2*p*p : 1 - ((-2*p + 2)**2)/2));

  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, { "--sl-width": 67, "--sl-height": 67 });

  let progress = { value: 0, fps: 24 };
  let heroResumeTimeout = null;
  let heroVideo = null;

  // Ask HomeHero for the first, actual video element
  const waitForHeroVideo = () => new Promise(resolve => {
    const onReady = (e) => resolve(e.detail?.videoElement || null);
    window.addEventListener("homeHeroFirstVideoReady", onReady, { once: true });
    window.dispatchEvent(new CustomEvent("siteLoaderRequestFirstVideo"));
  });

  // Pin the hero video inside the expanding edges box (no DOM move)
  function placeHeroVideoIntoLoaderBox() {
    if (!heroVideo || !edgesBox) return;

    const rect = edgesBox.getBoundingClientRect();
    const w = rect.width  || initialVideoWidth;
    const h = rect.height || initialVideoHeight;
    const x = rect.left   || (window.innerWidth - w) / 2;
    const y = rect.top    || (window.innerHeight - h) / 2;

    gsap.set(heroVideo, {
      position: "fixed",
      top: y, left: x,
      width: w, height: h,
      x: 0, y: 0, xPercent: 0, yPercent: 0,
      opacity: 1,
      zIndex: 1, // below loader chrome (z=2/3/4), above page
      willChange: "top,left,width,height,transform"
    });
  }

  // Animate hero video back to its stage rect
  function morphHeroVideoToStage(duration = 1.8) {
    if (!heroVideo || !heroVideoContainer) return;

    const to = heroVideoContainer.getBoundingClientRect();
    return gsap.to(heroVideo, {
      top: to.top,
      left: to.left,
      width: to.width,
      height: to.height,
      duration,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(heroVideo, {
          clearProps: "position,top,left,width,height,x,y,xPercent,yPercent,willChange,zIndex,opacity"
        });
        heroVideo.classList.add("home-hero_video_el", "is-active");
      }
    });
  }

  // Keep video aligned on resize while loader is active
  const onResize = () => {
    if (loaderEl.style.display !== "none" && heroVideo) placeHeroVideoIntoLoaderBox();
  };
  window.addEventListener("resize", onResize);

  // Resume handler
  const onHeroReadyForReveal = () => { tl.play(); };
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });

  // Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
    }
  });

  // Phase 1: progress (also keeps video pinned to the expanding box)
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
      placeHeroVideoIntoLoaderBox();
    }
  })

  // Phase 2: get the real hero video and ensure it's playing
  .call(async () => {
    heroVideo = await waitForHeroVideo();
    if (heroVideo && heroVideo.play) { try { await heroVideo.play(); } catch {} }
    placeHeroVideoIntoLoaderBox();
  })

  // Phase 3: fade counter
  .to(progressText, { opacity: 0, duration: 0.3 })

  // Phase 4: slight settle
  .set({}, {}, "+=0.1")

  // Phase 5: slide the BLACK curtain off to reveal the video beneath
  .to(curtainEl, {
    xPercent: 100,
    duration: 1.6,
    ease: "custom2InOut"
  })

  // Phase 6: fade loader chrome
  .to([corners, fpsCounter], { opacity: 0, duration: 0.6, stagger: 0.02 })
  .to(edgesBox, { opacity: 0, scale: 1.5, duration: 0.7, ease: "power3.inOut" }, "<0.024")

  // Phase 7: morph hero video to its stage rect (same element, still playing)
  .add(() => morphHeroVideoToStage(1.8))

  // Phase 8: signal + wait for hero to be ready
  .call(() => {
    window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", {
      detail: {
        src: heroVideo?.currentSrc || heroVideo?.src || null,
        videoElement: heroVideo,
        isTransferred: true
      }
    }));
    heroResumeTimeout = setTimeout(onHeroReadyForReveal, 1000);
  })
  .addPause("await-hero-ready")

  // Phase 9: reveal nav + lists
  .to(heroContent, { visibility: "visible", opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" })

  // Phase 10: fade loader
  .to(loaderEl, { opacity: 0, duration: 0.3, ease: "power2.out" })
  .call(() => { window.dispatchEvent(new CustomEvent("siteLoaderComplete")); });

  // Start after min time
  tl.pause();
  setTimeout(() => tl.play(), 2000);

  // Cleanup
  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    window.removeEventListener("homeHeroReadyForReveal", onHeroReadyForReveal);
    window.removeEventListener("resize", onResize);
    if (heroResumeTimeout) clearTimeout(heroResumeTimeout);
    delete loaderEl.dataset.scriptInitialized;
  };
}
