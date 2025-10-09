// assets/v1/sections/site-loader/index.js - Fixed with immediate start and proper state management
import { createState } from "./state.js";
import { createUIElements, lockScroll } from "./ui-elements.js";
import { setupVideo } from "./video-setup.js";
import { createMainTimeline } from "./timeline.js";
import { hideHeroContent } from "./hero-handoff.js";

export default function initSiteLoader(container) {
  // Guard: only on initial page load
  if (!window.__initialPageLoad) {
    console.log("[SiteLoader] Skipping - not initial page load");
    const existingLoader = container.querySelector(".site-loader_wrap");
    if (existingLoader) {
      existingLoader.style.display = "none";
    }
    return () => {};
  }

  console.log("[SiteLoader] init");

  const loaderEl = container.querySelector(".site-loader_wrap");
  if (!loaderEl) return () => {};
  
  if (loaderEl.dataset.scriptInitialized) {
    loaderEl.style.display = "none";
    return () => {};
  }
  
  loaderEl.dataset.scriptInitialized = "true";
  loaderEl.style.display = "flex";

  // Setup
  const lock = lockScroll();
  const state = createState();
  const ui = createUIElements(loaderEl, container);
  const video = setupVideo(container, ui.videoWrapper);
  
  // Store cleanup functions
  const cleanupFunctions = [];
  
  // Hide hero content during loader
  hideHeroContent(container);
  
  // Initial states
  if (window.gsap) {
    gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
    gsap.set(ui.nameReveal, { opacity: 1, visibility: "visible" });
  } else {
    loaderEl.style.display = "flex";
    loaderEl.style.opacity = "1";
    loaderEl.style.zIndex = "10000";
    if (ui.nameReveal) {
      ui.nameReveal.style.opacity = "1";
      ui.nameReveal.style.visibility = "visible";
    }
  }
  
  // Create timeline
  let timeline = null;
  
  const onComplete = () => {
    loaderEl.style.display = "none";
    document.documentElement.classList.remove("is-preloading");
    lock.remove();
    
    // Clean up state
    if (state.heroReadyListener) {
      window.removeEventListener("homeHeroReadyForReveal", state.heroReadyListener);
      state.heroReadyListener = null;
    }
    if (state.heroResumeTimeout) {
      clearTimeout(state.heroResumeTimeout);
      state.heroResumeTimeout = null;
    }
    if (state.visibilityListener) {
      document.removeEventListener("visibilitychange", state.visibilityListener);
      state.visibilityListener = null;
    }
    
    console.log("[SiteLoader] done");
  };
  
  if (window.gsap) {
    timeline = createMainTimeline({
      state,
      ui,
      video,
      container,
      loaderEl,
      lock,
      onComplete
    });
    
    cleanupFunctions.push(() => {
      if (timeline) timeline.kill();
    });
    
    // Start immediately or wait for visibility
    if (document.hidden) {
      // If tab is hidden, pause and wait for visibility
      timeline.pause();
      state.visibilityListener = () => {
        if (!document.hidden && timeline && timeline.paused()) {
          timeline.play();
        }
      };
      document.addEventListener("visibilitychange", state.visibilityListener, { once: true });
    }
    // Timeline plays immediately on creation if tab is visible
  } else {
    // No GSAP fallback - just hide immediately
    onComplete();
  }

  // Cleanup
  return () => {
    // Run all cleanup functions
    cleanupFunctions.forEach(fn => fn && fn());
    
    if (timeline) {
      timeline.kill();
    }
    
    if (lock?.parentNode) {
      lock.remove();
    }
    
    document.documentElement.classList.remove("is-preloading");
    
    if (state.heroReadyListener) {
      window.removeEventListener("homeHeroReadyForReveal", state.heroReadyListener);
    }
    
    if (state.heroResumeTimeout) {
      clearTimeout(state.heroResumeTimeout);
    }
    
    if (state.visibilityListener) {
      document.removeEventListener("visibilitychange", state.visibilityListener);
    }
    
    // Clean up video
    if (video) {
      try {
        video.pause();
        video.src = "";
        video.load();
        video.remove();
      } catch {}
    }
    
    // Clean up UI elements
    if (ui.videoWrapper?.parentNode) {
      ui.videoWrapper.remove();
    }
    
    delete loaderEl.dataset.scriptInitialized;
    loaderEl.style.display = "none";
  };
}