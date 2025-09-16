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
  
  // Get hero elements
  const heroSection = document.querySelector(".home-hero_wrap");
  const heroVideoContainer = document.querySelector(".home-hero_video");
  const navWrap = document.querySelector(".nav_wrap");
  
  // Hide hero content initially (will show after morph)
  if (heroSection) {
    gsap.set([heroSection, navWrap], { 
      opacity: 0,
      visibility: "hidden"
    });
  }
  
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
      // Final cleanup
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
  
  // MORPH VIDEO TO FULLSCREEN
  .call(() => {
    if (!bgVideo || !videoBox) return;
    
    // Clone video for seamless morph
    const morphVideo = bgVideo.cloneNode(true);
    morphVideo.currentTime = bgVideo.currentTime;
    morphVideo.play().catch(() => {});
    
    // Position morph video absolutely in viewport
    morphVideo.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${videoBox.offsetWidth}px;
      height: ${videoBox.offsetHeight}px;
      object-fit: cover;
      z-index: 9999;
      pointer-events: none;
    `;
    
    document.body.appendChild(morphVideo);
    
    // Hide original preloader video
    videoBox.style.opacity = '0';
    
    // Animate to fullscreen
    gsap.to(morphVideo, {
      width: '100vw',
      height: '100vh',
      duration: 1.5,
      ease: "power3.inOut",
      onComplete: () => {
        // Add morphed video to hero container
        if (heroVideoContainer) {
          morphVideo.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 2;
          `;
          morphVideo.classList.add('home-hero_video_el', 'is-active');
          heroVideoContainer.appendChild(morphVideo);
        }
        
        // Show hero section
        if (heroSection) {
          gsap.set([heroSection, navWrap], { 
            visibility: "visible"
          });
          gsap.to([heroSection, navWrap], {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => {
              // Trigger hero intro animations
              window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete'));
              
              // After a delay, fade out morph video and let real videos take over
              setTimeout(() => {
                const firstHeroVideo = heroVideoContainer?.querySelector('.home-hero_video_el:not(:first-child)');
                if (firstHeroVideo) {
                  firstHeroVideo.classList.add('is-active');
                  gsap.set(firstHeroVideo, { opacity: 1 });
                }
                gsap.to(morphVideo, {
                  opacity: 0,
                  duration: 0.8,
                  ease: "power2.out",
                  onComplete: () => morphVideo.remove()
                });
              }, 2000);
            }
          });
        }
      }
    });
  })
  
  // Fade out loader wrapper
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.8,
    delay: 0.5
  }, "-=1");

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