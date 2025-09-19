// transitions/nav-reveal.js - Simplified wrapper
import { createProjectNavTimeline } from "../../site-timelines/project-nav-timeline.js";

/**
 * Animate navigation elements on project pages
 * @param {HTMLElement} container - The page container
 * @returns {GSAPTimeline|null} The animation timeline
 */
export function createProjectNavAnimation(container) {
  const result = createProjectNavTimeline(container);
  return result ? result.timeline : null;
}

/**
 * Hide navigation elements (useful for transitions)
 * @param {HTMLElement} container - The page container
 */
export function hideNavElements(container) {
  gsap.set([
    ".nav_wrap",
    ".nav_link",
    ".project_name",
    ".project-player_center-toggle",
    ".project-player_controls",
    ".project-player_btn--play",
    ".project-player_btn--mute",
    ".project-player_btn--fs",
    ".project-player_timeline"
  ], {
    opacity: 0
  });
}

/**
 * Reset navigation elements to default state
 * @param {HTMLElement} container - The page container
 */
export function resetNavElements(container) {
  gsap.set([
    ".nav_wrap",
    ".nav_link",
    ".project_name",
    ".project-player_center-toggle",
    ".project-player_controls",
    ".project-player_btn--play",
    ".project-player_btn--mute", 
    ".project-player_btn--fs",
    ".project-player_timeline"
  ], {
    clearProps: "all"
  });
}