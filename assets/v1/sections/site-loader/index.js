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
  const curtain = loaderEl.querySelector(".site-loader_curtain");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  
  // Create video wrapper inside loader (like reference site)
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  videoWrapper.style.cssText = `
    position: absolute;
    width: 349px;
    height: 198px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    opacity: 0;
    clip-path: inset(0 0 0 0);
  `;
  
  // Get first project video URL
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  // Create video element
  const video = document.createElement('video');
  video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  
  if (firstVideoUrl) {
    video.src = firstVideoUrl;
    video.load();
    console.log("[SiteLoader] Using video:", firstVideoUrl);
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

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  let progress = { value: 0, fps: 24 };
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, {
    "--sl-width": 67,
    "--sl-height": 67
  });

  // Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
    }
  });

  if (prefersReducedMotion) {
    tl.timeScale(10);
  }

  // Progress animation (0-3s)
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
      if (edgesBox) {
        gsap.set(edgesBox, {
          "--sl-width": Math.max(Math.round(371 * progress.value), 67),
          "--sl-height": Math.max(Math.round(220 * progress.value), 67)
        });
      }
      if (fpsCounter) {
        fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
      }
    },
    onComplete: () => {
      // Start video playback
      video.currentTime = 0.001;
      video.play().catch(() => {});
    }
  })
  
  // Fade out progress text (3.3s)
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Show video wrapper
  .set(videoWrapper, { opacity: 1 })
  
  // Slide curtain to reveal video (3.5s)
  .to(videoCurtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "power3.inOut" 
  })
  
  // Scale video slightly during reveal
  .to(video, { 
    scale: 1.2,
    duration: 1.6, 
    ease: "power3.inOut" 
  }, "<")
  
  // Start morphing sequence
  .add(() => {
    // Fade out corners and FPS
    gsap.to([corners, fpsCounter], {
      opacity: 0,
      duration: 0.6,
      stagger: 0.02
    });
    
    // Fade and scale out edges
    gsap.to(edgesBox, {
      opacity: 0,
      scale: 1.5,
      duration: 0.7,
      ease: "power3.inOut"
    });
  })
  
  // Morph video to fullscreen (4.5s)
  .to(videoWrapper, {
    width: "100vw",
    height: "100vh",
    top: "50%",
    left: "50%",
    duration: 1.8,
    ease: "power3.inOut"
  }, "-=0.5")
  
  // Continue scaling video during morph
  .to(video, {
    scale: 1,
    duration: 2,
    ease: "power3.inOut"
  }, "<")
  
  // Transfer video to hero container
  .add(() => {
    // Clone video for seamless transfer
    const heroVideo = video.cloneNode(true);
    heroVideo.currentTime = video.currentTime;
    heroVideo.className = 'home-hero_video_el is-active';
    heroVideo.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 1;';
    
    // Add to hero container
    heroVideoContainer.appendChild(heroVideo);
    heroVideo.play().catch(() => {});
    
    // Show hero container
    gsap.set(heroVideoContainer, { opacity: 1 });
  }, "-=0.3")
  
  // Fade in hero content
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.3")
  
  // Fade out loader
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.5
  }, "-=0.5");

  // Minimum display time
  const minDisplayTime = 2000;
  const startTime = Date.now();
  
  tl.pause();
  setTimeout(() => {
    tl.play();
  }, Math.max(0, minDisplayTime - (Date.now() - startTime)));

  // Cleanup
  return () => {
    console.log("[SiteLoader] cleanup");
    tl.kill();
    gsap.killTweensOf([loaderEl, progressText, videoWrapper, curtain, corners, fpsCounter]);
    if (lock && lock.parentNode) {
      lock.remove();
    }
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}