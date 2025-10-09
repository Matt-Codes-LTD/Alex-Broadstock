// assets/v1/sections/site-loader/hero-handoff.js - Communication with hero section
import { SELECTORS } from "./constants.js";

export function hideHeroContent(container) {
  const heroContent = container.querySelectorAll(SELECTORS.heroContent);
  const heroVideo = container.querySelector(SELECTORS.heroVideo);
  
  gsap.set(heroContent, { opacity: 0, visibility: "hidden" });
  gsap.set(heroVideo, { opacity: 0, zIndex: 0 });
}

export function setupHandoff(timeline, video, ui) {
  // The timeline pause/resume is now handled inside the timeline itself
  // This just returns a cleanup function
  
  return () => {
    // Cleanup is handled in state
  };
}