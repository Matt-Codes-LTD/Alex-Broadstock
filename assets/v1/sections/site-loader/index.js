// assets/v1/sections/site-loader/index.js
// COMPLETE REWRITE FOR 100% SMOOTH ANIMATION
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

  // Create video wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  gsap.set(videoWrapper, {
    position: "fixed",
    width: videoWidth,
    height: videoHeight,
    left: "50%", top: "50%", xPercent: -50, yPercent: -50,
    zIndex: 1, opacity: 0, overflow: "hidden",
    transformOrigin: "50% 50%",
    force3D: true,
    rotationZ: 0.01 // Force GPU layer
  });

  // Get first video URL
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;

  // Create video element
  const video = document.createElement("video");
  video.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  
  // Create curtain
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  gsap.set(videoCurtain, {
    position: "absolute",
    top: 0, left: 0,
    width: "100%", height: "100%",
    background: "#020202",
    transformOrigin: "left center",
    force3D: true
  });
  
  videoWrapper.appendChild(video);
  videoWrapper.appendChild(videoCurtain);

  // Insert into DOM
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  const edgesBoxEl = loaderEl.querySelector(".site-loader_edges");
  if (edgesBoxEl) {
    edgesBoxEl.parentNode.insertBefore(videoWrapper, edgesBoxEl);
  } else {
    loaderContainer.appendChild(videoWrapper);
  }

  // Hide hero during loader
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 0, zIndex: 0 });

  // Custom ease
  gsap.registerEase("custom2InOut", p => (p < 0.5 ? 2*p*p : 1 - ((-2*p + 2)**2)/2));

  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, { "--sl-width": 67, "--sl-height": 67 });

  // State
  let progress = { value: 0, fps: 24 };
  let heroResumeTimeout = null;
  let videoReady = false;

  // Pre-load video completely
  const prepareVideo = () => new Promise((resolve) => {
    if (!firstVideoUrl) {
      resolve();
      return;
    }
    
    video.src = firstVideoUrl;
    
    const ensureReady = async () => {
      // Wait for video to be loadable
      if (video.readyState < 3) {
        await new Promise(r => {
          video.addEventListener('canplaythrough', r, { once: true });
        });
      }
      
      // Start playing to decode frames
      video.currentTime = 0.001;
      await video.play().catch(() => {});
      
      // Wait for actual frame rendering
      if ('requestVideoFrameCallback' in video) {
        await new Promise(r => {
          video.requestVideoFrameCallback(() => {
            videoReady = true;
            resolve();
          });
        });
      } else {
        // Fallback: wait for multiple frames
        await new Promise(r => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                videoReady = true;
                resolve();
              });
            });
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

  // Morph helper
  function morphWrapperToHero(duration = 1.8) {
    if (!heroVideoContainer) return;
    
    const from = videoWrapper.getBoundingClientRect();
    const to = heroVideoContainer.getBoundingClientRect();
    
    const dx = (to.left + to.width/2) - (from.left + from.width/2);
    const dy = (to.top + to.height/2) - (from.top + from.height/2);
    const sx = to.width / from.width;
    const sy = to.height / from.height;
    
    return gsap.to(videoWrapper, {
      x: dx,
      y: dy,
      scaleX: sx,
      scaleY: sy,
      duration,
      ease: "power3.inOut",
      force3D: true
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

  // Phase 1: Progress animation (video loads in parallel)
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
  
  // Phase 2: Ensure video is ready
  .call(async () => {
    if (!videoReady) {
      await prepareVideo();
    }
    // Video is now playing and rendered
  })
  
  // Phase 3: Fade progress text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 4: Show video wrapper (video already playing inside)
  .to(videoWrapper, { 
    opacity: 1, 
    duration: 0.3, 
    ease: "power2.out"
  })
  
  // Small pause to ensure compositing is done
  .set({}, {}, "+=0.1")
  
  // Phase 5: Reveal video by sliding curtain
  .to(videoCurtain, {
    xPercent: 100,
    duration: 1.6,
    ease: "custom2InOut"
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
  
  // Phase 7: Morph to hero position (complete before handoff)
  .add(() => {
    if (heroVideoContainer) {
      gsap.set(heroVideoContainer, { opacity: 1, zIndex: 0 });
    }
    return morphWrapperToHero(1.8);
  })
  
  // Phase 8: Handoff when morph complete
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
  
  // Phase 9: Hero confirmed ready - reveal UI first
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  })
  
  // Phase 10: Fade loader AFTER hero is showing (videos are aligned)
  .to(videoWrapper, {
    opacity: 0,
    duration: 0.5,
    ease: "power2.inOut"
  }, "-=0.2")
  .to(loaderEl, {
    opacity: 0,
    duration: 0.3,
    ease: "power2.out"
  }, "-=0.3")
  .call(() => {
    window.dispatchEvent(new CustomEvent("siteLoaderComplete"));
  });

  // Start after minimum time
  tl.pause();
  
  // Start video preload immediately
  prepareVideo();
  
  // Play timeline after 2s minimum
  setTimeout(() => tl.play(), 2000);

  // Cleanup
  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    window.removeEventListener("homeHeroReadyForReveal", onHeroReadyForReveal);
    if (heroResumeTimeout) clearTimeout(heroResumeTimeout);
    delete loaderEl.dataset.scriptInitialized;
  };
}