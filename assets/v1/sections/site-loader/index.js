// site-loader/index.js - Orchestrator only
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
  
  // Initial states
  gsap.set(loaderEl, { display: "flex", opacity: 1, zIndex: 10000 });
  gsap.set(ui.progressText, { opacity: 1 });
  gsap.set(ui.edgesBox, { "--sl-width": 67, "--sl-height": 67 });
  
  // Create timeline
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

  // Start after minimum time
  timeline.pause();
  setTimeout(() => timeline.play(), CONFIG.MIN_LOAD_TIME);

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