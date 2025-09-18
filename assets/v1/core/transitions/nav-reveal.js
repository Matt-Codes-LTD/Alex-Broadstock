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
  
  // Nav wrapper foundation
  tl.fromTo(".nav_wrap", {
    opacity: 0,
    y: -20
  }, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  
  // Back link + other nav links
  .fromTo(".nav_link", {
    opacity: 0,
    x: 20
  }, {
    opacity: 1,
    x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  
  // Project name - slide from left like project titles
  .fromTo(".project_name", {
    opacity: 0,
    x: -30,
    filter: "blur(4px)"
  }, {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    duration: 0.5,
    ease: "power2.out"
  }, "-=0.3")
  
  // Bottom controls container
  .fromTo(".project-player_controls", {
    opacity: 0,
    y: 20
  }, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power3.out"
  }, "-=0.4")
  
  // Play button and timeline (subtle fade)
  .fromTo([".project-player_btn--play", ".project-player_timeline"], {
    opacity: 0
  }, {
    opacity: 1,
    duration: 0.4,
    ease: "power2.out"
  }, "-=0.3")
  
  // Sound and Fullscreen text - stagger up from bottom
  .fromTo([".project-player_btn--mute", ".project-player_btn--fs"], {
    opacity: 0,
    y: 15
  }, {
    opacity: 1,
    y: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.3")
  
  // Center sound/play button - scale up with bounce
  .fromTo(".project-player_center-toggle", {
    opacity: 0,
    scale: 0.85
  }, {
    opacity: 1,
    scale: 1,
    duration: 0.6,
    ease: "back.out(1.7)"
  }, "-=0.4");
  
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