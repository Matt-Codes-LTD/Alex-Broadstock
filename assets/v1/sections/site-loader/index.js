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
  
  // Viewport base for responsive units
  const vwScreen = window.innerWidth <= 479 ? 479 : 
                   window.innerWidth <= 767 ? 767 : 
                   window.innerWidth <= 991 ? 991 : 1920;
  
  // Calculate video dimensions in pixels
  const videoWidth = 349 * (window.innerWidth / vwScreen);
  const videoHeight = 198 * (window.innerWidth / vwScreen);
  
  // Create dedicated loader video wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  
  // Position video fixed to viewport center
  gsap.set(videoWrapper, {
    position: "fixed",
    width: videoWidth,
    height: videoHeight,
    left: "50%",
    top: "50%",
    xPercent: -50,
    yPercent: -50,
    zIndex: 1,
    opacity: 0,
    overflow: "hidden"
  });
  
  // Get first project video URL
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  // Create video element
  const video = document.createElement('video');
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  
  if (firstVideoUrl) {
    video.src = firstVideoUrl;
    console.log("[SiteLoader] Using video:", firstVideoUrl);
  }
  
  videoWrapper.appendChild(video);
  
  // Add curtain
  const videoCurtain = document.createElement("div");
  videoCurtain.className = "site-loader_video-curtain";
  gsap.set(videoCurtain, {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%", 
    height: "100%",
    background: "#020202"
  });
  videoWrapper.appendChild(videoCurtain);
  
  // Insert video wrapper at same z-level as edges
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  
  // Insert before edges box so it's behind
  if (edgesBox) {
    edgesBox.parentNode.insertBefore(videoWrapper, edgesBox);
  } else {
    loaderContainer.appendChild(videoWrapper);
  }
  
  // Hide hero content initially
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideoContainer, { opacity: 0 });

  // Register ease
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
    "--sl-height": 67
  });

  // Main timeline
  const tl = gsap.timeline({
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
      window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete'));
    }
  });

  // Phase 1: Progress
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
    },
    onComplete: () => {
      if (video) {
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  })
  
  // Phase 2: Fade text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 3: Video reveal
  .to(videoWrapper, { opacity: 1, duration: 0.3, ease: "power2.out" })
  .to(videoCurtain, { xPercent: 100, duration: 1.6, ease: "custom2InOut" })
  .to(video, { scale: 1.2, duration: 1.6, ease: "custom2InOut" }, "<")
  
  // Phase 4: Fade UI elements
  .to([corners, fpsCounter], { opacity: 0, duration: 0.6, stagger: 0.02 })
  .to(edgesBox, { opacity: 0, scale: 1.5, duration: 0.7, ease: "power3.inOut" }, "<0.024")
  
  // Phase 5: Scale from center
  .to(video, {
    scale: 1,
    duration: 0.8,
    ease: "power2.inOut"
  })
  
  // Scale to fullscreen size while maintaining center
  .to(videoWrapper, {
    width: window.innerWidth,
    height: window.innerHeight,
    duration: 1.8,
    ease: "power3.inOut"
  }, "<")
  
  // Then move to final position
  .to(videoWrapper, {
    xPercent: 0,
    yPercent: 0,
    left: 0,
    top: 0,
    duration: 0.3,
    ease: "power2.inOut"
  })
  
  // Phase 6: Show hero content
  .call(() => {
    if (heroVideoContainer && firstVideoUrl) {
      let heroVideo = heroVideoContainer.querySelector('.home-hero_video_el');
      if (!heroVideo) {
        heroVideo = document.createElement('video');
        heroVideo.className = 'home-hero_video_el is-active';
        heroVideo.src = firstVideoUrl;
        heroVideo.muted = true;
        heroVideo.loop = true;
        heroVideo.playsInline = true;
        heroVideo.style.cssText = `
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        `;
        heroVideoContainer.appendChild(heroVideo);
      }
      heroVideo.currentTime = video.currentTime;
      heroVideo.play().catch(() => {});
      gsap.set(heroVideoContainer, { opacity: 1 });
    }
  })
  
  // Fade in UI
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.5")
  
  // Fade out loader
  .to(loaderEl, { opacity: 0, duration: 0.5 }, "-=0.5");

  // Play after min time
  tl.pause();
  setTimeout(() => tl.play(), 2000);

  return () => {
    tl.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}