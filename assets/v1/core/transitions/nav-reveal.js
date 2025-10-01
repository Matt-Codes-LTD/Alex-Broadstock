// transitions/nav-reveal.js - Navigation reveal animations for all pages

/**
 * Animate navigation elements on any page
 * @param {HTMLElement} container - The page container
 * @returns {GSAPTimeline|null} The animation timeline
 */
export function createProjectNavAnimation(container) {
  const namespace = container.dataset.barbaNamespace;
  
  // Always ensure nav is visible on all pages
  gsap.set(".nav_wrap", {
    visibility: "visible",
    opacity: 1
  });
  
  gsap.set(".nav_link", {
    visibility: "visible",
    opacity: 1
  });
  
  // Only animate project-specific elements on project pages
  if (namespace === "project") {
    gsap.set([
      ".project_name",
      ".project-player_center-toggle",
      ".project-player_controls"
    ], {
      visibility: "visible"
    });
    
    const tl = gsap.timeline();
    
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
    }, "<")
    
    // Links and project name - quick fade in
    .fromTo([".nav_link", ".project_name"], {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.25,
      stagger: 0.02,
      ease: "power2.out"
    }, "<0.05")
    
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
  
  // For home page or any other page, just ensure nav is visible
  return null;
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