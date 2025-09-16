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

  // Get elements
  const progressText = loaderEl.querySelector(".site-loader_progress-text");
  const fpsCounter = loaderEl.querySelector(".site-loader_fps-counter");
  const edgesBox = loaderEl.querySelector(".site-loader_edges");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  
  // Get the actual hero video container
  const heroVideoContainer = container.querySelector(".home-hero_video");
  if (!heroVideoContainer) {
    console.error("[SiteLoader] No hero video container found");
    return () => {};
  }
  
  // Move hero video container into loader
  const originalParent = heroVideoContainer.parentNode;
  const originalNextSibling = heroVideoContainer.nextSibling;
  
  // Style it for the loader animation
  heroVideoContainer.style.cssText = `
    position: absolute;
    width: 349px;
    height: 198px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    opacity: 0;
    clip-path: inset(0 0 0 0);
    overflow: hidden;
  `;
  
  // Add curtain overlay
  const curtain = document.createElement("div");
  curtain.className = "site-loader_curtain-overlay";
  curtain.style.cssText = `
    position: absolute;
    top: -1%;
    left: 0;
    width: 100%;
    height: 102%;
    background: #020202;
    z-index: 100;
    pointer-events: none;
  `;
  heroVideoContainer.appendChild(curtain);
  
  // Move to loader container (before edges so it's behind)
  if (edgesBox) {
    loaderContainer.insertBefore(heroVideoContainer, edgesBox);
  } else {
    loaderContainer.appendChild(heroVideoContainer);
  }
  
  // Get first video and ensure it plays
  const firstVideo = heroVideoContainer.querySelector('.home-hero_video_el');
  if (firstVideo) {
    firstVideo.muted = true;
    firstVideo.currentTime = 0.001;
    firstVideo.style.opacity = "1";
    firstVideo.play().catch(() => {});
  }

  // Hide hero UI initially
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });

  // Register custom ease
  gsap.registerEase("custom2InOut", function(progress) {
    return progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  });

  // State
  let progress = { value: 0, fps: 24 };
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(progressText, { opacity: 1 });
  gsap.set(edgesBox, {
    "--sl-width": 67,
    "--sl-height": 67,
    zIndex: 2,
    background: "transparent"
  });

  // Timeline
  const tl = gsap.timeline({
    onComplete: () => {
      // Move hero video back to original position
      heroVideoContainer.style.cssText = '';
      heroVideoContainer.classList.add("u-cover-absolute", "u-inset-0", "u-zindex-0");
      
      // Remove curtain
      curtain.remove();
      
      // Move back to original parent
      if (originalNextSibling) {
        originalParent.insertBefore(heroVideoContainer, originalNextSibling);
      } else {
        originalParent.appendChild(heroVideoContainer);
      }
      
      // Cleanup
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
      window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete'));
    }
  });

  // Phase 1: Progress (3s)
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
        gsap.set(edgesBox, {
          "--sl-width": width,
          "--sl-height": height
        });
      }
      
      if (fpsCounter) fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
    }
  })
  
  // Phase 2: Fade text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 3: Show video
  .to(heroVideoContainer, { 
    opacity: 1, 
    duration: 0.3,
    ease: "power2.out"
  })
  
  // Slide curtain
  .to(curtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "custom2InOut"
  })
  
  // Phase 4: Fade corners/edges
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
  }, "<")
  
  // Phase 5: Morph to fullscreen
  .to(heroVideoContainer, {
    width: "100vw",
    height: "100vh",
    duration: 2,
    ease: "power3.inOut"
  })
  
  // Show hero UI
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.5")
  
  // Fade loader
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.5
  }, "-=0.5");

  // Play after min time
  const minDisplayTime = 2000;
  tl.pause();
  setTimeout(() => tl.play(), minDisplayTime);

  // Cleanup
  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}