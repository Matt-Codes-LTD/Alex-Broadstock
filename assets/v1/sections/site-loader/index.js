export default function initSiteLoader(container) {
  // Skip if this is a Barba navigation (not a fresh page load)
  if (window.__barbaNavigated) {
    console.log("[SiteLoader] Skipping - Barba navigation");
    return () => {};
  }

  console.log("[SiteLoader] init");

  // Look in document, not container (loader is outside barba container)
  const loaderEl = document.querySelector(".site-loader_wrap");
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
  const videoBox = loaderEl.querySelector(".site-loader_video-wrap");
  const bgVideo = loaderEl.querySelector(".site-loader_video");
  const curtain = loaderEl.querySelector(".site-loader_curtain");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  
  // Get hero container for morph target
  const heroVideoContainer = document.querySelector(".home-hero_video");
  
  // Dynamically get the first project's video URL
  const firstProjectItem = document.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  // Update video source if found
  if (bgVideo && firstVideoUrl) {
    // Remove any existing sources
    bgVideo.querySelectorAll('source').forEach(s => s.remove());
    
    // Create new source with dynamic URL
    const source = document.createElement('source');
    source.src = firstVideoUrl + '#t=0.5'; // Add poster frame timestamp
    source.type = 'video/mp4';
    bgVideo.appendChild(source);
    bgVideo.load(); // Reload video with new source
    
    console.log("[SiteLoader] Using video:", firstVideoUrl);
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  let progress = { value: 0, fps: 24 };
  
  // Reset initial states
  gsap.set(loaderEl, { 
    display: "flex",
    opacity: 1,
    pointerEvents: "all" 
  });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(videoBox, { opacity: 0, scale: 1.1 });
  gsap.set(curtain, { xPercent: 0 });
  gsap.set(corners, { opacity: 1 });
  
  // Set initial size CSS variables
  gsap.set(edgesBox, {
    "--sl-width": 67,
    "--sl-height": 67
  });

  // Create timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Final cleanup after morph
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
      
      // Dispatch custom event for other modules
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
    }
  });

  // Apply faster animation if reduced motion
  if (prefersReducedMotion) {
    tl.timeScale(10);
  }

  // Progress animation with expanding edges
  tl.to(progress, {
    value: 1,
    fps: 120,
    duration: 3,
    ease: "sine.inOut",
    onUpdate: () => {
      const pct = Math.round(progress.value * 100);
      if (progressText) {
        progressText.textContent = pct.toString().padStart(2, "0");
      }

      // Expand edges from 67 to final size
      if (edgesBox) {
        gsap.set(edgesBox, {
          "--sl-width": Math.max(Math.round(371 * progress.value), 67),
          "--sl-height": Math.max(Math.round(220 * progress.value), 67)
        });
      }

      // Update FPS counter
      if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
      }
    },
    onComplete: () => {
      // Start video if it exists
      if (bgVideo) {
        try {
          bgVideo.currentTime = 0.01;
          bgVideo.play().catch(() => {});
        } catch {}
      }
    }
  })
  
  // Fade out progress text
  .to(progressText, { 
    opacity: 0, 
    duration: 0.3 
  })
  
  // Reveal video with curtain slide
  .to(curtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "power3.inOut" 
  })
  
  // Fade in video
  .to(videoBox, { 
    opacity: 1, 
    scale: 1, 
    duration: 1.6, 
    ease: "power3.inOut" 
  }, "<")
  
  // Fade out corners
  .to(corners, {
    opacity: 0,
    duration: 0.8,
    stagger: 0.05
  }, "<0.5")
  
  // Fade out FPS counter
  .to(fpsCounter, {
    opacity: 0,
    duration: 0.6
  }, "<")
  
  // MORPH VIDEO TO HERO BACKGROUND
  .call(() => {
    if (!bgVideo || !heroVideoContainer || !videoBox) return;
    
    // Capture current state with Flip
    const state = Flip.getState(bgVideo);
    
    // Prepare video for morph
    bgVideo.classList.add("site-loader-morph-video");
    bgVideo.style.position = "absolute";
    bgVideo.style.inset = "0";
    bgVideo.style.width = "100%";
    bgVideo.style.height = "100%";
    bgVideo.style.objectFit = "cover";
    bgVideo.style.zIndex = "2"; // Above other hero videos temporarily
    
    // Move video to hero container
    heroVideoContainer.appendChild(bgVideo);
    
    // Animate morph
    Flip.from(state, {
      duration: 1.5,
      ease: "power3.inOut",
      absolute: true,
      scale: true,
      onComplete: () => {
        // After morph, trigger fade to existing hero video
        gsap.to(bgVideo, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            // Clean up morph video
            bgVideo.remove();
            
            // Ensure first hero video is active
            const firstHeroVideo = heroVideoContainer.querySelector('.home-hero_video_el');
            if (firstHeroVideo) {
              firstHeroVideo.classList.add('is-active');
              gsap.set(firstHeroVideo, { opacity: 1 });
            }
          }
        });
      }
    });
  })
  
  // Fade out loader wrapper (happens during morph)
  .to(loaderEl, { 
    opacity: 0, 
    duration: 1.2,
    delay: 0.3
  }, "-=1.5"); // Overlap with morph

  // Minimum display time (optional)
  const minDisplayTime = 2000;
  const startTime = Date.now();
  
  // Pause timeline initially to ensure minimum display time
  tl.pause();
  
  setTimeout(() => {
    tl.play();
  }, Math.max(0, minDisplayTime - (Date.now() - startTime)));

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    tl.kill();
    gsap.killTweensOf([loaderEl, progressText, videoBox, curtain, corners, fpsCounter, bgVideo]);
    if (lock && lock.parentNode) {
      lock.remove();
    }
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}