// site-loader/index.js - Orchestrator with Enter gate
import { createState } from "./state.js";
import { createUIElements, lockScroll, unlockScroll } from "./ui-elements.js";
import { setupVideo } from "./video-setup.js";
import { createMainTimeline } from "./timeline.js";
import { hideHeroContent } from "./hero-handoff.js";
import { CONFIG } from "./constants.js";

export default function initSiteLoader(container) {
  // Guard: only on initial page load
  if (!window.__initialPageLoad) {
    console.log("[SiteLoader] Skipping - not initial page load");
    const existingLoader = container.querySelector(".site-loader_wrap");
    if (existingLoader) existingLoader.style.display = "none";
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
  
  // Hide hero content during loader
  hideHeroContent(container);
  
  // Initial states - loader visible but elements hidden
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  
  // IMPORTANT: Hide all loader elements initially except Enter
  gsap.set([ui.progressText, ui.corners, ui.fpsCounter], { 
    opacity: 0,
    visibility: "hidden" 
  });
  gsap.set(ui.edgesBox, { 
    opacity: 0,
    visibility: "hidden",
    "--sl-width": 67, 
    "--sl-height": 67 
  });
  gsap.set(ui.videoWrapper, { 
    opacity: 0 
  });
  
  // Create timeline but DON'T start it until Enter is clicked
  const timeline = createMainTimeline({
    state,
    ui,
    video,
    container,
    loaderEl,
    lock,
    onComplete: () => {
      loaderEl.style.display = "none";
      document.documentElement.classList.remove("is-preloading");
      lock.remove();
      console.log("[SiteLoader] done");
    }
  });

  // Timeline is created but waiting for Enter click to start
  
  // Cleanup
  return () => {
    timeline.kill();
    if (lock?.parentNode) lock.remove();
    document.documentElement.classList.remove("is-preloading");
    if (state.heroReadyListener) {
      window.removeEventListener("homeHeroReadyForReveal", state.heroReadyListener);
    }
    if (state.heroResumeTimeout) clearTimeout(state.heroResumeTimeout);
    delete loaderEl.dataset.scriptInitialized;
    loaderEl.style.display = "none";
  };
}