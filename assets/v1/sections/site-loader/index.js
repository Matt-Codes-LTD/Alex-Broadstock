// site-loader/index.js - Orchestrator only
import { createState } from "./state.js";
import { createUIElements, lockScroll, unlockScroll } from "./ui-elements.js";
import { setupVideo } from "./video-setup.js";
import { createMainTimeline } from "./timeline.js";
import { hideHeroContent, setupHandoff } from "./hero-handoff.js";
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
  const lockCleanup = lockScroll();
  const state = createState();
  const ui = createUIElements(loaderEl, container);
  const video = setupVideo(container, ui.videoWrapper);
  
  // Hide hero content during loader
  hideHeroContent(container);
  
  // Create timeline
  const timeline = createMainTimeline({
    state,
    ui,
    video,
    container,
    loaderEl,
    onComplete: () => {
      loaderEl.style.display = "none";
      unlockScroll(lockCleanup);
      console.log("[SiteLoader] done");
    }
  });

  // Setup handoff communication
  const handoffCleanup = setupHandoff(timeline, video, ui);

  // Start after minimum time
  timeline.pause();
  setTimeout(() => timeline.play(), CONFIG.MIN_LOAD_TIME);

  // Cleanup
  return () => {
    timeline.kill();
    unlockScroll(lockCleanup);
    handoffCleanup();
    delete loaderEl.dataset.scriptInitialized;
    loaderEl.style.display = "none";
  };
}