// assets/v1/sections/site-loader/index.js
// SIMPLE, ROBUST APPROACH - No complex handoffs, just clean animations
export default function initSiteLoader(container) {
  if (window.__barbaNavigated) {
    console.log("[SiteLoader] Skipping - Barba navigation");
    return () => {};
  }

  console.log("[SiteLoader] Starting");

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
  
  // Get first video URL
  const firstProjectItem = container.querySelector('.home-hero_list .home-hero_item');
  const firstVideoUrl = firstProjectItem?.dataset?.video || '';
  
  // Hide hero content initially
  const heroSection = container.querySelector(".home-hero_wrap");
  const heroVideo = container.querySelector(".home-hero_video");
  const heroContent = container.querySelectorAll(".nav_wrap, .home-hero_menu, .home-hero_awards");
  
  if (heroVideo) gsap.set(heroVideo, { opacity: 0 });
  if (heroContent) gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  
  // Create video wrapper
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "site-loader_video-wrapper";
  Object.assign(videoWrapper.style, {
    position: 'fixed',
    width: '349px',
    height: '198px',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '1',
    opacity: '0',
    overflow: 'hidden'
  });
  
  // Create video
  const video = document.createElement('video');
  Object.assign(video.style, {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  });
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  if (firstVideoUrl) video.src = firstVideoUrl;
  
  // Create curtain
  const curtain = document.createElement("div");
  curtain.className = "site-loader_video-curtain";
  Object.assign(curtain.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: '#020202',
    zIndex: '2'
  });
  
  // Assemble
  videoWrapper.appendChild(video);
  videoWrapper.appendChild(curtain);
  loaderContainer.appendChild(videoWrapper);
  
  // Progress state
  let progress = 0;
  
  // Create timeline
  const tl = gsap.timeline({
    onComplete: () => {
      console.log("[SiteLoader] Animation complete");
      document.documentElement.classList.remove("is-preloading");
      loaderEl.style.display = "none";
    }
  });
  
  // 1. Progress counter
  tl.to({ progress: 0 }, {
    progress: 100,
    duration: 3,
    ease: "sine.inOut",
    onUpdate: function() {
      const val = Math.round(this.progress());
      if (progressText) progressText.textContent = String(val).padStart(2, '0');
      
      // Update edges size
      if (edgesBox) {
        const width = 67 + (371 - 67) * (val / 100);
        const height = 67 + (220 - 67) * (val / 100);
        edgesBox.style.setProperty('--sl-width', width);
        edgesBox.style.setProperty('--sl-height', height);
      }
      
      if (fpsCounter) fpsCounter.textContent = `FPS: ${Math.round(60 + val * 0.6)}`;
    },
    onComplete: () => {
      video.play().catch(e => console.log("[SiteLoader] Video play failed:", e));
    }
  })
  
  // 2. Fade out progress text
  .to(progressText, { opacity: 0, duration: 0.3 })
  
  // 3. Show video wrapper
  .set(videoWrapper, { opacity: 1 })
  
  // 4. Reveal video - curtain slides right while video scales
  .to(curtain, { 
    x: '100%', 
    duration: 1.6, 
    ease: "power2.inOut" 
  })
  .fromTo(video, 
    { scale: 1.2 },
    { scale: 1, duration: 1.6, ease: "power2.inOut" },
    "<"
  )
  
  // 5. Fade out UI elements
  .to([corners, fpsCounter], { 
    opacity: 0, 
    duration: 0.6, 
    stagger: 0.02 
  }, "-=0.8")
  .to(edgesBox, { 
    opacity: 0, 
    scale: 1.5, 
    duration: 0.7, 
    ease: "power3.inOut" 
  }, "-=0.6")
  
  // 6. Scale video wrapper to fullscreen
  .to(videoWrapper, {
    width: window.innerWidth,
    height: window.innerHeight,
    duration: 1.8,
    ease: "power3.inOut"
  })
  
  // 7. Move to 0,0
  .to(videoWrapper, {
    left: 0,
    top: 0,
    x: 0,
    y: 0,
    duration: 0.3,
    ease: "power2.inOut"
  })
  
  // 8. Initialize hero behind loader
  .add(() => {
    console.log("[SiteLoader] Initializing hero");
    if (heroVideo) gsap.set(heroVideo, { opacity: 1 });
    
    // Tell hero to start
    window.dispatchEvent(new CustomEvent('siteLoaderMorphComplete'));
  })
  
  // 9. Wait for hero to be ready
  .to({}, { duration: 0.5 })
  
  // 10. Crossfade to hero
  .to(videoWrapper, { 
    opacity: 0, 
    duration: 0.8,
    ease: "power2.inOut"
  })
  
  // 11. Show UI
  .to(heroContent, {
    visibility: "visible",
    opacity: 1,
    duration: 0.4,
    stagger: 0.1,
    ease: "power2.out"
  }, "-=0.4")
  
  // 12. Final cleanup
  .to(loaderEl, { opacity: 0, duration: 0.5 }, "-=0.3")
  .add(() => {
    videoWrapper.remove();
    window.dispatchEvent(new CustomEvent('siteLoaderComplete'));
  });
  
  // Start after delay
  tl.pause();
  setTimeout(() => tl.play(), 2000);
  
  // Cleanup
  return () => {
    tl.kill();
    document.documentElement.classList.remove("is-preloading");
    if (videoWrapper.parentNode) videoWrapper.remove();
    delete loaderEl.dataset.scriptInitialized;
  };
}