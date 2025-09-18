// transitions/nav-reveal.js - Navigation reveal animations

/**
 * Animate navigation elements on project pages
 * @param {HTMLElement} container - The page container
 * @returns {GSAPTimeline|null} The animation timeline
 */
export function createProjectNavAnimation(container) {
  // Only animate on project pages
  if (container.dataset.barbaNamespace !== "project") {
    return null;
  }
  
  // Set initial visible states (CSS handles opacity: 0)
  gsap.set([
    ".nav_wrap",
    ".nav_link",
    ".project_name",
    ".project-player_center-toggle",
    ".project-player_controls"
  ], {
    visibility: "visible"
  });
  
  const tl = gsap.timeline();
  
  // All elements reveal nearly simultaneously for instant appearance
  
  // Nav wrapper and center button - appear immediately
  tl.fromTo([".nav_wrap", ".project-player_center-toggle"], {
    opacity: 0,
    y: -10
  }, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: "power2.out"
  })
  
  // Controls container - appears with nav
  .fromTo(".project-player_controls", {
    opacity: 0,
    y: 10
  }, {
    opacity: 1,
    y: 0,
    duration: 0.3,
    ease: "power2.out"
  }, "<") // Start at same time as nav
  
  // Links and project name - quick fade in
  .fromTo([".nav_link", ".project_name"], {
    opacity: 0
  }, {
    opacity: 1,
    duration: 0.25,
    stagger: 0.02, // Minimal stagger
    ease: "power2.out"
  }, "<0.05") // Tiny offset
  
  // Player controls - all together
  .fromTo([
    ".project-player_btn--play", 
    ".project-player_timeline",
    ".project-player_btn--mute", 
    ".project-player_btn--fs"
  ], {
    opacity: 0
  }, {
    opacity: 1,
    duration: 0.25,
    ease: "power2.out"
  }, "<");
  
  return tl;
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