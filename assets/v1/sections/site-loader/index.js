// ============================================
// FILE 1: assets/v1/sections/site-loader/index.js
// ============================================
export default function initSiteLoader(container) {
  // Double-check: skip if not initial page load
  if (!window.__initialPageLoad) {
    console.log("[SiteLoader] Skipping - not initial page load");
    // Hide any existing loader element
    const existingLoader = container.querySelector(".site-loader_wrap");
    if (existingLoader) existingLoader.style.display = "none";
    return () => {};
  }

  console.log("[SiteLoader] init");

  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl) return () => {};
  
  // Skip if already initialized
  if (loaderEl.dataset.scriptInitialized) {
    loaderEl.style.display = "none";
    return () => {};
  }
  
  loaderEl.dataset.scriptInitialized = "true";
  
  // Explicitly show the loader when initializing
  loaderEl.style.display = "flex";

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
    x: 0, y: 0, scaleX: 1, scaleY: 1,
    zIndex: 1, opacity: 0, overflow: "hidden",
    transformOrigin: "50% 50%",
    willChange: "transform, opacity",
    transform: "translate3d(0,0,0)" // Force GPU layer
  });

  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;

  const video = document.createElement("video");
  video.style.cssText = "width:100%;height:100%;object-fit:cover;";
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = "auto"; video.crossOrigin = "anonymous";
  if (firstVideoUrl) {
    video.src = firstVideoUrl;
    console.log("[SiteLoader] Using video:", firstVideoUrl);
    
    // Pre-warm video immediately
    video.load();
    video.currentTime = 0.001;
  }
  videoWrapper.appendChild(video);

  // Curtain
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  gsap.set(videoCurtain, {position:"absolute",top:0,left:0,width:"100%",height:"100%",background:"var(--swatch--brand-ink)"});
  videoWrapper.appendChild(videoCurtain);

  // Insert
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  const edgesBoxEl = loaderEl.querySelector(".site-loader_edges");
  if (edgesBoxEl) edgesBoxEl.parentNode.insertBefore(videoWrapper, edgesBoxEl);
  else loaderContainer.appendChild(videoWrapper);

  // Hide hero during loader
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-awards_list");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 0, zIndex: 0 });

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
  const onHeroReadyForReveal = () => { tl.play(); };
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });

  // Helper: FLIP morph to hero stage rect using transforms only
  function morphWrapperToHero(duration = 1.8) {
    if (!heroVideoContainer) return;
    const from = videoWrapper.getBoundingClientRect();
    const to   = heroVideoContainer.getBoundingClientRect();

    const fromCx = from.left + from.width  / 2;
    const fromCy = from.top  + from.height / 2;
    const toCx   = to.left   + to.width    / 2;
    const toCy   = to.top    + to.height   / 2;

    const dx = toCx - fromCx;
    const dy = toCy - fromCy;
    const sx = to.width  / from.width;
    const sy = to.height / from.height;

    // Use transform3d for GPU acceleration
    gsap.set(videoWrapper, {
      willChange: "transform",
      force3D: true
    });

    gsap.to(videoWrapper, {
      x: dx, 
      y: dy, 
      scaleX: sx, 
      scaleY: sy,
      duration, 
      ease: "power3.inOut",
      force3D: true,
      onComplete: () => {
        gsap.set(videoWrapper, { willChange: "auto" });
      }
    });
  }

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
      
      // Start video early at 80% to pre-render frames
      if (progress.value >= 0.8 && video && !video.__started) {
        video.__started = true;
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  })
  // Phase 2: Fade text
  .to(progressText, { opacity: 0, duration: 0.3 })
  // Phase 2.5: Ensure video is ready and rendered
  .call(async () => {
    if (!video || video.__frameReady) return;
    
    // Wait for video to render frames
    await new Promise(resolve => {
      const checkFrame = () => {
        if (video.readyState >= 3 && video.currentTime > 0) {
          // Use requestVideoFrameCallback if available for perfect sync
          if ('requestVideoFrameCallback' in video) {
            video.requestVideoFrameCallback(() => {
              video.__frameReady = true;
              resolve();
            });
          } else {
            // Fallback: wait for two animation frames
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                video.__frameReady = true;
                resolve();
              });
            });
          }
        } else {
          requestAnimationFrame(checkFrame);
        }
      };
      checkFrame();
    });
  })
  // Phase 3: Video reveal (smooth now that frames are ready)
  .to(videoWrapper, { opacity: 1, duration: 0.3, ease: "power2.out" })
  .to(videoCurtain, { xPercent: 100, duration: 1.6, ease: "custom2InOut" })
  // Phase 4: Fade UI elements
  .to([corners, fpsCounter], { opacity: 0, duration: 0.6, stagger: 0.02 })
  .to(edgesBox, { opacity: 0, scale: 1.5, duration: 0.7, ease: "power3.inOut" }, "<0.024")
  // Phase 5: FLIP morph wrapper → hero stage (scale wrapper only, not video)
  .call(() => {
    // Pre-position hero stage behind loader
    if (heroVideoContainer) gsap.set(heroVideoContainer, { opacity: 1, zIndex: 0 });
    // Start morphing wrapper to hero position
    morphWrapperToHero(1.8);
  })
  // Phase 6: Handoff with frame sync
  .call(() => {
    const detail = {
      src: firstVideoUrl || null,
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      loaderVideo: video,
      loaderWrapper: videoWrapper
    };
    window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
    heroResumeTimeout = setTimeout(onHeroReadyForReveal, 1500);
  })
  .addPause("await-hero-ready")
  // Phase 7: Move loader behind content, then staggered reveal
  .set(loaderEl, { zIndex: 1 }) // Move loader behind content
  .set([
    ".nav_wrap",
    ".home_hero_categories", 
    ".home-hero_menu",
    ".home-awards_list"
  ], {
    visibility: "visible",
    opacity: 1  // Ensure parent containers are visible
  })
  .set([
    ".brand_logo",
    ".nav_link",
    ".home-category_text"
  ], {
    visibility: "visible"
  })
  // Keep project elements hidden until animation
  .set([
    ".home_hero_text",
    ".home-category_ref_text:not([hidden])",
    ".home-awards_list"
  ], {
    opacity: 0
  })
  // Nav wrapper foundation
  .fromTo(".nav_wrap", {
    opacity: 0,
    y: -20
  }, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  // Brand logo
  .fromTo(".brand_logo", {
    opacity: 0,
    scale: 0.9
  }, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5")
  // Nav links
  .fromTo(".nav_link", {
    opacity: 0,
    x: 20
  }, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  // Category filters
  .fromTo(".home-category_text", {
    opacity: 0,
    y: 15,
    rotateX: -45
  }, {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power3.out"
  }, "-=0.5")
  // Project rows - animate name and tags together per row
  .add(() => {
    const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
    visibleRows.forEach((row, index) => {
      const name = row.querySelector(".home_hero_text");
      const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      // Animate name from left
      if (name) {
        gsap.fromTo(name, {
          opacity: 0,
          x: -30,
          filter: "blur(4px)"
        }, {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05
        });
      }
      
      // Animate tags from right simultaneously
      if (tags.length) {
        gsap.fromTo(tags, {
          opacity: 0,
          x: 20
        }, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05,
          stagger: 0.02
        });
      }
    });
  }, "-=0.2") // Overlap with nav categories finishing
  // Awards strip - delay after last row
  .fromTo(".home-awards_list", {
    opacity: 0,
    y: 20,
    scale: 0.95
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    ease: "power3.out",
    delay: 0.3,
    onComplete: () => {
      // Clean up will-change properties
      gsap.set([
        ".nav_wrap",
        ".brand_logo",
        ".nav_link",
        ".home-category_text",
        ".home_hero_text",
        ".home-category_ref_text",
        ".home-awards_list"
      ], {
        clearProps: "transform,filter"
      });
    }
  })
  // Fade loader and wrapper
  .to([videoWrapper, loaderEl], { 
    opacity: 0, 
    duration: 0.6, 
    ease: "power2.inOut" 
  }, "-=0.8")
  .call(() => { 
    window.dispatchEvent(new CustomEvent("siteLoaderComplete")); 
  });

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
    loaderEl.style.display = "none"; // Ensure hidden on cleanup
  };
}