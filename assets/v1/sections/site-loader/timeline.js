// site-loader/timeline.js - Now just a wrapper
import { createLoaderTimeline } from "../../site-timelines/loader-timeline.js";

export function createMainTimeline({ state, ui, video, container, loaderEl, lock, onComplete }) {
  // Setup hero ready handler
  const onHeroReady = () => { 
    console.log("[SiteLoader] Hero ready - resuming timeline");
    loaderInstance.resume(); 
  };
  
  window.addEventListener("homeHeroReadyForReveal", onHeroReady, { once: true });
  state.heroReadyListener = onHeroReady;
  
  // Create timeline instance
  const loaderInstance = createLoaderTimeline({
    state,
    ui,
    video,
    container,
    loaderEl,
    onComplete,
    onHeroReady
  });
  
  // Return the GSAP timeline for compatibility
  return loaderInstance.timeline;
}