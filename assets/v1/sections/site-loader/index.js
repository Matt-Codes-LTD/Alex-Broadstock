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
  
  console.log("[DEBUG] Elements found:", {
    progressText: !!progressText,
    fpsCounter: !!fpsCounter,
    edgesBox: !!edgesBox,
    corners: corners.length
  });
  
  // Determine viewport base for responsive units
  const vwScreen = window.innerWidth <= 479 ? 479 : 
                   window.innerWidth <= 767 ? 767 : 
                   window.innerWidth <= 991 ? 991 : 1920;
  
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
    z-index: 1;
    opacity: 0;
    clip-path: inset(0 0 0 0);
    overflow: hidden;
  `;
  
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
  video.autoplay = true; // Add autoplay
  
  if (firstVideoUrl) {
    video.src = firstVideoUrl + '#t=0.5';
    video.load();
    console.log("[SiteLoader] Using video:", firstVideoUrl);
    
    // Ensure video loads
    video.addEventListener('loadeddata', () => {
      console.log("Video loaded, duration:", video.duration);
      video.currentTime = 0.001;
    }, { once: true });
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
  
  // Insert video wrapper BEFORE edges box so it's behind
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  const edgesInContainer = loaderContainer?.querySelector(".site-loader_edges");
  if (loaderContainer && edgesInContainer) {
    loaderContainer.insertBefore(videoWrapper, edgesInContainer);
  } else if (loaderContainer) {
    loaderContainer.appendChild(videoWrapper);
  }
  
  // Hide hero content initially
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  
  if (heroContent.length) {
    gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  }
  if (heroVideoContainer) {
    gsap.set(heroVideoContainer, { opacity: 0 });
  }

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
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  
  if (progressText) {
    gsap.set(progressText, { opacity: 1 });
  }
  
  if (edgesBox) {
    gsap.set(edgesBox, {
      "--sl-width": 67,
      "--sl-height": 67,
      zIndex: 2 // Ensure edges are above video initially
    });
  }
  
  // Set video wrapper behind edges but visible
  gsap.set(videoWrapper, {
    zIndex: 1 // Behind edges but above background
  });

  console.log("[SiteLoader] Creating timeline");

  // Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      console.log("[SiteLoader] Animation complete");
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
      window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete'));
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
    onStart: () => console.log("[Phase 1] Progress animation start"),
    onUpdate: () => {
      const pct = Math.round(progress.value * 100);
      
      if (progressText) {
        progressText.textContent = pct.toString().padStart(2, "0");
      }
      
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
      console.log("[Phase 1] Complete, starting video");
      if (video) {
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  });
  
  // Phase 2: Fade out progress text and prepare video
  if (progressText) {
    tl.to(progressText, { 
      opacity: 0, 
      duration: 0.3,
      onStart: () => console.log("[Phase 2] Fade progress text"),
      onComplete: () => {
        // Move edges to higher z-index after text fades
        if (edgesBox) {
          gsap.set(edgesBox, { zIndex: 3 });
        }
      }
    });
  }
  
  // Phase 3: Show video behind edges - use .to() instead of .set() to ensure it animates
  tl.to(videoWrapper, {
    opacity: 1,
    zIndex: 1, // Behind edges (z-index 3)
    duration: 0.3,
    ease: "power2.out",
    onStart: () => {
      console.log("[Phase 3] Fading in video wrapper");
      console.log("Initial opacity:", getComputedStyle(videoWrapper).opacity);
    },
    onComplete: () => {
      console.log("[Phase 3] Video wrapper visible behind edges");
      console.log("Final opacity:", getComputedStyle(videoWrapper).opacity);
      console.log("Video wrapper actual size:", videoWrapper.offsetWidth + "x" + videoWrapper.offsetHeight);
      console.log("Edges box z-index:", edgesBox ? getComputedStyle(edgesBox).zIndex : "N/A");
    }
  });
  
  // Small pause to see video behind edges - removed as it's not needed
  
  // Slide curtain to reveal video
  tl.to(videoCurtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "custom2InOut",
    onStart: () => {
      console.log("[Phase 4] Sliding curtain to reveal video");
      video.play().catch(e => console.log("Video play error:", e));
    },
    onUpdate: function() {
      if (this.progress() > 0.5 && !this._logged) {
        this._logged = true;
        console.log("Curtain 50% - video should be visible in center");
      }
    },
    onComplete: () => console.log("Curtain fully slid, video revealed")
  });
  
  // Scale video during reveal - animate separately to avoid array issue
  tl.to(video, { 
    scale: 1.2,
    duration: 1.6, 
    ease: "custom2InOut"
  }, "<");
  
  // Phase 4: Exit animation
  tl.add(() => {
    console.log("[Phase 5] Exit animations");
    
    // Fade out corners
    if (corners.length) {
      gsap.to(corners, {
        opacity: 0,
        duration: 0.8,
        stagger: 0.05
      });
    }
    
    // Fade out FPS counter
    if (fpsCounter) {
      gsap.to(fpsCounter, {
        opacity: 0,
        duration: 0.6
      });
    }
  });
  
  // Fade and scale edges
  if (edgesBox) {
    tl.to(edgesBox, {
      opacity: 0,
      scale: 1.5,
      duration: 0.7,
      ease: "power3.inOut",
      delay: 0.024
    }, "<");
  }
  
  // Phase 5: Morph to fullscreen - animate video and wrapper separately
  tl.to(video, {
    scale: 1,
    duration: 2,
    ease: "power3.inOut",
    onStart: () => console.log("[Phase 6] Morph to fullscreen")
  });
  
  tl.to(videoWrapper, {
    scale: 1,
    duration: 2,
    ease: "power3.inOut"
  }, "<");
  
  tl.to(videoWrapper, {
    width: "100%",
    height: "100%",
    duration: 1.8,
    ease: "power3.inOut",
    overwrite: "auto"
  }, "<");
  
  // Phase 6: Transfer to hero
  tl.add(() => {
    console.log("[Phase 7] Transfer to hero");
    
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
    }
  }, "-=0.3");
  
  // Fade in hero content
  if (heroContent.length) {
    tl.to(heroContent, {
      visibility: "visible",
      opacity: 1,
      duration: 0.4,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.3");
  }
  
  // Fade out loader
  tl.to(loaderEl, { 
    opacity: 0, 
    duration: 0.5
  }, "-=0.5");

  console.log("[SiteLoader] Timeline duration:", tl.duration());

  // Minimum display time
  const minDisplayTime = 2000;
  const startTime = Date.now();
  
  tl.pause();
  setTimeout(() => {
    console.log("[SiteLoader] Playing timeline");
    tl.play();
  }, Math.max(0, minDisplayTime - (Date.now() - startTime)));

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    tl.kill();
    gsap.killTweensOf([loaderEl, progressText, videoWrapper, videoCurtain, video, edgesBox]);
    if (corners.length) {
      gsap.killTweensOf(corners);
    }
    if (fpsCounter) {
      gsap.killTweensOf(fpsCounter);
    }
    if (lock && lock.parentNode) {
      lock.remove();
    }
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}