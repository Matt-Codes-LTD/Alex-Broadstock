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
  const videoContainer = container.querySelector(".home-hero_video");
  const curtain = loaderEl.querySelector(".site-loader_curtain");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  
  // Hide hero content initially
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  
  // Get first video URL and create/update video element
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  let firstVideo = videoContainer?.querySelector('.home-hero_video_el');
  
  // CREATE VIDEO ELEMENT IF IT DOESN'T EXIST
  if (!firstVideo && videoContainer && firstVideoUrl) {
    firstVideo = document.createElement('video');
    firstVideo.className = 'home-hero_video_el';
    firstVideo.muted = true;
    firstVideo.loop = true;
    firstVideo.playsInline = true;
    firstVideo.preload = 'auto';
    firstVideo.crossOrigin = 'anonymous';
    videoContainer.appendChild(firstVideo);
  }
  
  if (firstVideo && firstVideoUrl) {
    firstVideo.src = firstVideoUrl;
    firstVideo.load();
    console.log("[SiteLoader] Using video:", firstVideoUrl);
  }

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // State
  let progress = { value: 0, fps: 24 };
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(videoContainer, { 
    width: "349px",
    height: "198px",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    scale: 1.1,
    opacity: 0,
    zIndex: 9999  // Ensure video is above curtain initially
  });
  gsap.set(curtain, { xPercent: 0 });
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

  // Progress animation
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
      if (firstVideo) {
        firstVideo.currentTime = 0.01;
        firstVideo.play().catch(() => {});
      }
    }
  })
  
  // Fade out progress text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Show video with proper z-index
  .to(videoContainer, { 
    opacity: 1, 
    zIndex: 9999,
    duration: 0.5 
  }, "-=0.2")
  
  // Slide curtain to reveal video
  .to(curtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "power3.inOut" 
  })
  
  // Scale video during curtain slide
  .to(videoContainer, { 
    scale: 1.2,
    duration: 1.6, 
    ease: "power3.inOut" 
  }, "<")
  
  // Fade out corners and FPS
  .to([corners, fpsCounter], {
    opacity: 0,
    duration: 0.6,
    stagger: 0.02
  }, "<0.5")
  
  // Fade out edges
  .to(edgesBox, {
    opacity: 0,
    scale: 1.5,
    duration: 0.7,
    ease: "power3.inOut"
  }, "<0.2")
  
  // Morph video to fullscreen
  .to(videoContainer, {
    width: "100%",
    height: "100%",
    scale: 1,
    duration: 1.8,
    ease: "power3.inOut",
    clearProps: "transform,zIndex",
    onComplete: () => {
      // Reset video container to original state
      gsap.set(videoContainer, {
        position: "absolute",
        top: 0,
        left: 0,
        transform: "none",
        zIndex: ""
      });
      // Mark video as active for home-hero module
      if (firstVideo) {
        firstVideo.classList.add('is-active');
      }
    }
  }, "-=0.5")
  
  // Fade in hero content
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.3")
  
  // Fade out loader wrapper
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.5,
    zIndex: -1
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
    gsap.killTweensOf([loaderEl, progressText, videoContainer, curtain, corners, fpsCounter]);
    if (lock && lock.parentNode) {
      lock.remove();
    }
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}