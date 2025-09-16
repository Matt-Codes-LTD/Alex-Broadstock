// assets/v1/sections/site-loader/index.js
export default function initSiteLoader(container) {
  // Skip if this is a Barba navigation (not a fresh page load)
  if (window.__barbaNavigated) {
    console.log("[SiteLoader] Skipping - Barba navigation");
    return () => {};
  }

  console.log("[SiteLoader] init");

  // Look for loader inside hero section
  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl || loaderEl.dataset.scriptInitialized) return () => {};
  loaderEl.dataset.scriptInitialized = "true";

  // Lock scroll during preload
  document.documentElement.classList.add("is-preloading");
  const lock = document.createElement("style");
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);

  // Get elements
  const progressText = loaderEl.querySelector(".site-loader_progress-text");
  const fpsCounter = loaderEl.querySelector(".site-loader_fps-counter");
  const edgesBox = loaderEl.querySelector(".site-loader_edges");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  
  // Debug: Log initial element states
  console.log("[DEBUG] Initial states:", {
    edgesBox: edgesBox ? getComputedStyle(edgesBox) : null,
    progressText: progressText?.textContent,
    cornersCount: corners.length
  });
  
  // Determine viewport base for responsive units
  const vwScreen = window.innerWidth <= 479 ? 479 : 
                   window.innerWidth <= 767 ? 767 : 
                   window.innerWidth <= 991 ? 991 : 1920;
  
  console.log("[DEBUG] Viewport screen base:", vwScreen, "Window width:", window.innerWidth);
  
  // Create video wrapper with viewport-relative dimensions
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  const videoWidth = `calc(349 / ${vwScreen} * 100 * 1vw)`;
  const videoHeight = `calc(198 / ${vwScreen} * 100 * 1vw)`;
  
  videoWrapper.style.cssText = `
    position: absolute;
    width: ${videoWidth};
    height: ${videoHeight};
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    opacity: 0;
    clip-path: inset(0 0 0 0);
  `;
  
  console.log("[DEBUG] Video wrapper dimensions:", { videoWidth, videoHeight });
  
  // Get first project video URL
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  // Create video element with initial scale
  const video = document.createElement('video');
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.0132);
  `;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  
  if (firstVideoUrl) {
    video.src = firstVideoUrl + '#t=0.5';
    video.load();
    console.log("[DEBUG] Video source:", firstVideoUrl);
  }
  
  videoWrapper.appendChild(video);
  
  // Add curtain inside video wrapper
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  videoCurtain.style.cssText = `
    position: absolute;
    top: -1%;
    left: 0;
    width: 100%;
    height: 102%;
    background: #020202;
    z-index: 1;
    transform: translateX(0);
  `;
  videoWrapper.appendChild(videoCurtain);
  
  // Insert video wrapper into loader container
  loaderEl.querySelector(".site-loader_container").appendChild(videoWrapper);
  
  // Hide hero content initially
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 0 });

  // Register custom ease to match reference
  gsap.registerEase("custom2InOut", function(progress) {
    if (progress < 0.5) {
      return 2 * progress * progress;
    } else {
      return 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }
  });

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  let progress = { value: 0, fps: 24 };
  let animationStartTime = performance.now();
  
  // Debug timeline progress
  const logPhase = (phase, details = {}) => {
    const elapsed = ((performance.now() - animationStartTime) / 1000).toFixed(2);
    console.log(`[ANIM ${elapsed}s] ${phase}`, details);
  };
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, {
    "--sl-width": 67,
    "--sl-height": 67
  });
  
  logPhase("Initial setup complete");

  // Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      logPhase("Timeline complete");
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
    },
    onUpdate: () => {
      // Log timeline progress every 10%
      const prog = Math.floor(tl.progress() * 10);
      if (!tl._lastProg || prog > tl._lastProg) {
        tl._lastProg = prog;
        logPhase(`Timeline progress: ${prog * 10}%`, {
          time: tl.time().toFixed(2),
          duration: tl.duration().toFixed(2)
        });
      }
    }
  });

  if (prefersReducedMotion) {
    tl.timeScale(10);
  }

  // Phase 1: Progress animation (0-3s)
  tl.to(progress, {
    value: 1,
    fps: 120,
    duration: 3,
    ease: "sine.inOut",
    onStart: () => logPhase("Phase 1: Progress animation START"),
    onUpdate: () => {
      const pct = Math.round(progress.value * 100);
      
      // Log at 0%, 25%, 50%, 75%, 100%
      if (pct % 25 === 0 && !progress[`logged${pct}`]) {
        progress[`logged${pct}`] = true;
        logPhase(`Progress ${pct}%`, {
          fps: Math.round(progress.fps),
          edgeWidth: edgesBox ? getComputedStyle(edgesBox).getPropertyValue('--sl-width') : 'N/A',
          edgeHeight: edgesBox ? getComputedStyle(edgesBox).getPropertyValue('--sl-height') : 'N/A'
        });
      }
      
      if (progressText) {
        progressText.textContent = pct.toString().padStart(2, "0");
      }
      // Expand edges from 67 to final size
      if (edgesBox) {
        const width = Math.round(67 + (371 - 67) * progress.value);
        const height = Math.round(67 + (220 - 67) * progress.value);
        gsap.set(edgesBox, {
          "--sl-width": width,
          "--sl-height": height
        });
      }
      if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
      }
    },
    onComplete: () => {
      logPhase("Phase 1 COMPLETE: Starting video", {
        videoState: video.readyState,
        currentTime: video.currentTime
      });
      if (video) {
        video.currentTime = 0.001;
        video.play().then(() => {
          logPhase("Video playing");
        }).catch((e) => {
          logPhase("Video play failed", { error: e.message });
        });
      }
    }
  })
  
  // Phase 2: Fade out progress text
  .to(progressText, { 
    opacity: 0, 
    duration: 0.3,
    onStart: () => logPhase("Phase 2: Fade progress text START"),
    onComplete: () => logPhase("Phase 2 COMPLETE")
  })
  
  // Phase 3: Video reveal sequence
  .to(videoWrapper, { 
    opacity: 1,
    duration: 0.3,
    ease: "power2.out",
    onStart: () => logPhase("Phase 3: Video wrapper fade in START", {
      wrapperDimensions: {
        width: videoWrapper.style.width,
        height: videoWrapper.style.height
      }
    }),
    onComplete: () => logPhase("Phase 3: Video wrapper visible")
  })
  
  // Slide curtain to reveal video
  .to(videoCurtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "custom2InOut",
    onStart: () => logPhase("Phase 4: Curtain slide START"),
    onUpdate: function() {
      // Log at 50% and 100%
      const prog = Math.floor(this.progress() * 2);
      if (!this._curtainProg || prog > this._curtainProg) {
        this._curtainProg = prog;
        logPhase(`Curtain ${prog * 50}% revealed`, {
          transform: videoCurtain.style.transform
        });
      }
    },
    onComplete: () => logPhase("Phase 4: Curtain slide COMPLETE")
  })
  
  // Scale video during reveal
  .to(video, { 
    scale: 1.2,
    duration: 1.6, 
    ease: "custom2InOut",
    onStart: () => logPhase("Video scale to 1.2 START"),
    onComplete: () => logPhase("Video scale to 1.2 COMPLETE")
  }, "<")
  
  // Phase 4: Exit animation
  .call(() => {
    logPhase("Phase 5: Exit animations START");
    
    // Fade out corners
    gsap.to(corners, {
      opacity: 0,
      duration: 0.8,
      stagger: 0.05,
      onComplete: () => logPhase("Corners faded out")
    });
    
    // Fade out FPS counter
    gsap.to(fpsCounter, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => logPhase("FPS counter faded out")
    });
  })
  
  // Fade and scale edges
  .to(edgesBox, {
    opacity: 0,
    scale: 1.5,
    duration: 0.7,
    ease: "power3.inOut",
    delay: 0.024,
    onStart: () => logPhase("Edges fade/scale START"),
    onComplete: () => logPhase("Edges fade/scale COMPLETE")
  }, "<")
  
  // Phase 5: Morph to fullscreen
  .to([videoWrapper, video], {
    scale: 1,
    duration: 2,
    ease: "power3.inOut",
    onStart: () => logPhase("Phase 6: Morph START"),
    onUpdate: function() {
      const prog = Math.floor(this.progress() * 4);
      if (!this._morphProg || prog > this._morphProg) {
        this._morphProg = prog;
        logPhase(`Morph ${prog * 25}%`, {
          wrapperTransform: videoWrapper.style.transform,
          videoTransform: video.style.transform
        });
      }
    }
  })
  
  .to(videoWrapper, {
    width: "100%",
    height: "100%",
    duration: 1.8,
    ease: "power3.inOut",
    overwrite: "auto",
    onComplete: () => logPhase("Video wrapper fullscreen")
  }, "<")
  
  // Phase 6: Transfer to hero
  .call(() => {
    logPhase("Phase 7: Transfer to hero START");
    
    // Clone video for seamless transfer
    const heroVideo = video.cloneNode(true);
    heroVideo.currentTime = video.currentTime;
    heroVideo.className = 'home-hero_video_el is-active';
    heroVideo.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 1;
    `;
    
    // Add to hero container
    if (heroVideoContainer) {
      heroVideoContainer.appendChild(heroVideo);
      heroVideo.play().catch(() => {});
      gsap.set(heroVideoContainer, { opacity: 1 });
      logPhase("Hero video added and playing");
    }
  }, "-=0.3")
  
  // Fade in hero content
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out",
    onStart: () => logPhase("Hero content fade in START"),
    onComplete: () => logPhase("Hero content visible")
  }, "-=0.3")
  
  // Fade out loader
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.5,
    onStart: () => logPhase("Loader fade out START"),
    onComplete: () => logPhase("Loader fade out COMPLETE")
  }, "-=0.5");
  
  logPhase("Timeline created", {
    totalDuration: tl.duration(),
    labels: tl.labels
  });

  // Minimum display time
  const minDisplayTime = 2000;
  const startTime = Date.now();
  
  tl.pause();
  setTimeout(() => {
    animationStartTime = performance.now();
    logPhase("Timeline PLAY");
    tl.play();
  }, Math.max(0, minDisplayTime - (Date.now() - startTime)));

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    tl.kill();
    gsap.killTweensOf([loaderEl, progressText, videoWrapper, videoCurtain, video, corners, fpsCounter, edgesBox]);
    if (lock && lock.parentNode) {
      lock.remove();
    }
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}