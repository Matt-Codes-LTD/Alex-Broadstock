// ============================================
// FILE 1: assets/v1/sections/site-loader/index.js
// ============================================
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

  // Get hero video container and first video URL
  const heroVideoContainer = container.querySelector(".home-hero_video");
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  if (!heroVideoContainer) {
    console.warn("[SiteLoader] No hero video container found");
    return () => {};
  }

  // Viewport base for responsive units
  const vwScreen = window.innerWidth <= 479 ? 479 :
                   window.innerWidth <= 767 ? 767 :
                   window.innerWidth <= 991 ? 991 : 1920;

  // Video dims (px) - starting size
  const videoWidth  = 349 * (window.innerWidth / vwScreen);
  const videoHeight = 198 * (window.innerWidth / vwScreen);

  // Create or get video element
  let video = heroVideoContainer.querySelector('.home-hero_video_el');
  if (!video && firstVideoUrl) {
    video = document.createElement("video");
    video.className = "home-hero_video_el is-active";
    video.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:1;";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.src = firstVideoUrl;
    heroVideoContainer.appendChild(video);
  }

  // Create curtain overlay for hero video
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  gsap.set(videoCurtain, {
    position: "absolute",
    top: 0, left: 0,
    width: "100%", height: "100%",
    background: "#020202",
    transformOrigin: "left center",
    force3D: true,
    zIndex: 2
  });
  heroVideoContainer.appendChild(videoCurtain);

  // Hide hero UI during loader
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });

  // Position hero video container at loader size initially
  const heroRect = heroVideoContainer.getBoundingClientRect();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const scaleX = videoWidth / heroRect.width;
  const scaleY = videoHeight / heroRect.height;
  
  gsap.set(heroVideoContainer, {
    opacity: 0,
    scale: Math.min(scaleX, scaleY),
    x: centerX - (heroRect.left + heroRect.width / 2),
    y: centerY - (heroRect.top + heroRect.height / 2),
    transformOrigin: "50% 50%",
    force3D: true,
    zIndex: 100
  });

  // Custom ease
  gsap.registerEase("custom2InOut", p => (p < 0.5 ? 2*p*p : 1 - ((-2*p + 2)**2)/2));

  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, { "--sl-width": 67, "--sl-height": 67 });

  // State
  let progress = { value: 0, fps: 24 };
  let heroResumeTimeout = null;

  // Pre-load video
  const prepareVideo = () => new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    
    const ensureReady = async () => {
      if (video.readyState < 3) {
        await new Promise(r => {
          video.addEventListener('canplaythrough', r, { once: true });
        });
      }
      
      video.currentTime = 0.001;
      await video.play().catch(() => {});
      
      if ('requestVideoFrameCallback' in video) {
        await new Promise(r => {
          video.requestVideoFrameCallback(() => resolve());
        });
      } else {
        await new Promise(r => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
          });
        });
      }
    };
    
    ensureReady();
  });

  // Resume handler
  const onHeroReadyForReveal = () => {
    tl.play();
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

  // Phase 1: Progress animation
  tl.to(progress, {
    value: 1,
    fps: 120,
    duration: 3,
    ease: "sine.inOut",
    onUpdate: () => {
      const pct = Math.round(progress.value * 100);
      if (progressText) progressText.textContent = pct.toString().padStart(2, "0");
      if (edgesBox) {
        const width = Math.round(67 + (371 - 67) * progress.value);
        const height = Math.round(67 + (220 - 67) * progress.value);
        gsap.set(edgesBox, { "--sl-width": width, "--sl-height": height });
      }
      if (fpsCounter) fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
    }
  })
  
  // Phase 2: Ensure video ready
  .call(async () => {
    await prepareVideo();
  })
  
  // Phase 3: Fade progress text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 4: Show hero video container (still small)
  .to(heroVideoContainer, { 
    opacity: 1, 
    duration: 0.3, 
    ease: "power2.out"
  })
  
  // Phase 5: Reveal video by sliding curtain
  .to(videoCurtain, {
    xPercent: 100,
    duration: 1.6,
    ease: "custom2InOut",
    onComplete: () => {
      videoCurtain.remove(); // Clean up curtain
    }
  })
  
  // Phase 6: Fade UI elements
  .to([corners, fpsCounter], {
    opacity: 0,
    duration: 0.6,
    stagger: 0.02
  })
  .to(edgesBox, {
    opacity: 0,
    scale: 1.5,
    duration: 0.7,
    ease: "power3.inOut"
  }, "<0.024")
  
  // Phase 7: Scale hero video to full size
  .to(heroVideoContainer, {
    scale: 1,
    x: 0,
    y: 0,
    duration: 1.8,
    ease: "power3.inOut"
  })
  
  // Phase 8: Signal hero
  .call(() => {
    const detail = {
      src: firstVideoUrl || null,
      videoElement: video,
      isPreloaded: true
    };
    window.dispatchEvent(new CustomEvent("siteLoaderMorphComplete", { detail }));
    heroResumeTimeout = setTimeout(onHeroReadyForReveal, 1500);
  })
  .addPause("await-hero-ready")
  
  // Phase 9: Reveal UI
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  })
  
  // Phase 10: Fade loader
  .to(loaderEl, {
    opacity: 0,
    duration: 0.5,
    ease: "power2.inOut"
  })
  .call(() => {
    heroVideoContainer.style.zIndex = ""; // Reset z-index
    window.dispatchEvent(new CustomEvent("siteLoaderComplete"));
  });

  // Start after minimum time
  tl.pause();
  prepareVideo();
  setTimeout(() => tl.play(), 2000);

  // Cleanup
  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    if (videoCurtain?.parentNode) videoCurtain.remove();
    document.documentElement.classList.remove("is-preloading");
    window.removeEventListener("homeHeroReadyForReveal", onHeroReadyForReveal);
    if (heroResumeTimeout) clearTimeout(heroResumeTimeout);
    delete loaderEl.dataset.scriptInitialized;
  };
}