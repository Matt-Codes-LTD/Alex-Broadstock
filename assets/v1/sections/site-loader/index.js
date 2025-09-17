// assets/v1/sections/site-loader/index.js
// HYBRID APPROACH: GSAP for UI, CSS Transitions for video handoff
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

  // Get elements
  const progressText = loaderEl.querySelector(".site-loader_progress-text");
  const fpsCounter = loaderEl.querySelector(".site-loader_fps-counter");
  const edgesBox = loaderEl.querySelector(".site-loader_edges");
  const corners = loaderEl.querySelectorAll(".site-loader_corner");
  const loaderContainer = loaderEl.querySelector(".site-loader_container");
  
  // Get hero elements
  const heroSection = container.querySelector(".home-hero_wrap");
  const heroVideoContainer = container.querySelector(".home-hero_video");
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  
  // Hide hero initially
  if (heroContent) gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  if (heroVideoContainer) gsap.set(heroVideoContainer, { opacity: 0 });
  
  // Get first video URL
  const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video;
  
  // Create video element with CSS transition class
  const video = document.createElement('video');
  video.className = 'site-loader-video home-hero_video_el';
  video.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 1.8s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center center;
  `;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  if (firstVideoUrl) video.src = firstVideoUrl;
  
  // Create video wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  videoWrapper.style.cssText = `
    position: fixed;
    width: 349px;
    height: 198px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    opacity: 0;
    overflow: hidden;
    transition: all 1.8s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Create curtain
  const curtain = document.createElement("div");
  curtain.className = "site-loader_video-curtain";
  curtain.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #020202;
    z-index: 2;
    transition: transform 1.6s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Assemble
  videoWrapper.appendChild(video);
  videoWrapper.appendChild(curtain);
  loaderContainer.appendChild(videoWrapper);
  
  // Progress state
  let progress = { value: 0, fps: 24 };
  
  // GSAP timeline for UI elements only
  const tl = gsap.timeline();
  
  // Phase 1: Progress counter
  tl.to(progress, {
    value: 100,
    fps: 120,
    duration: 3,
    ease: "sine.inOut",
    onUpdate: () => {
      const pct = Math.round(progress.value);
      if (progressText) progressText.textContent = String(pct).padStart(2, '0');
      if (edgesBox) {
        const width = 67 + (371 - 67) * (pct / 100);
        const height = 67 + (220 - 67) * (pct / 100);
        edgesBox.style.setProperty('--sl-width', width);
        edgesBox.style.setProperty('--sl-height', height);
      }
      if (fpsCounter) fpsCounter.textContent = `FPS: ${Math.round(progress.fps)}`;
    },
    onComplete: () => {
      video.currentTime = 0.001;
      video.play().catch(e => console.log("[SiteLoader] Video play failed:", e));
    }
  })
  
  // Phase 2: Fade out progress
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 3: Show video wrapper
  .call(() => {
    videoWrapper.style.opacity = '1';
  })
  
  // Phase 4: Reveal video with curtain
  .to({}, {
    duration: 0.1,
    onComplete: () => {
      // Start curtain slide with CSS
      video.style.transform = 'scale(1.2)';
      curtain.style.transform = 'translateX(100%)';
      
      // After curtain reveals video, scale it back
      setTimeout(() => {
        video.style.transform = 'scale(1)';
      }, 800);
    }
  })
  
  // Phase 5: Fade UI elements (GSAP)
  .to([corners, fpsCounter], { 
    opacity: 0, 
    duration: 0.6, 
    stagger: 0.02 
  }, "+=0.8")
  .to(edgesBox, { 
    opacity: 0, 
    scale: 1.5, 
    duration: 0.7, 
    ease: "power3.inOut" 
  }, "-=0.6")
  
  // Phase 6: Scale wrapper to fullscreen with CSS
  .call(() => {
    // Use CSS for smooth wrapper expansion
    videoWrapper.style.transition = 'all 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
    videoWrapper.style.width = window.innerWidth + 'px';
    videoWrapper.style.height = window.innerHeight + 'px';
    videoWrapper.style.transform = 'translate(-50%, -50%)';
  })
  
  // Wait for expansion
  .to({}, { duration: 1.8 })
  
  // Phase 7: Move wrapper to final position
  .call(() => {
    videoWrapper.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    videoWrapper.style.left = '50%';
    videoWrapper.style.top = '50%';
    videoWrapper.style.transform = 'translate(-50%, -50%)';
    
    // After positioning, do the handoff
    setTimeout(() => {
      // Move video to hero container while maintaining playback
      const currentTime = video.currentTime;
      
      // Remove transitions temporarily for instant placement
      video.style.transition = 'none';
      
      // Move video to hero
      video.remove();
      video.classList.add('is-active');
      video.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 1;
        transform: none;
      `;
      heroVideoContainer.appendChild(video);
      
      // Restore playback position
      video.currentTime = currentTime;
      
      // Show hero container
      gsap.set(heroVideoContainer, { opacity: 1 });
      
      // Hide empty wrapper
      videoWrapper.style.opacity = '0';
      
      // Tell hero system about the video
      window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete', {
        detail: {
          video: video,
          currentSrc: firstVideoUrl
        }
      }));
    }, 300);
  })
  
  // Phase 8: Show UI
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "+=0.5")
  
  // Phase 9: Clean up
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.5,
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      if (videoWrapper.parentNode) videoWrapper.remove();
      window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
    }
  });
  
  // Start timeline
  tl.pause();
  setTimeout(() => tl.play(), 2000);
  
  return () => {
    tl.kill();
    document.documentElement.classList.remove("is-preloading");
    delete loaderEl.dataset.scriptInitialized;
  };
}