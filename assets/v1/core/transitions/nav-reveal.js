// transitions/nav-reveal.js - Navigation reveal animations for all pages

/**
 * Animate navigation and content on home page
 * @param {HTMLElement} container - The page container
 * @returns {GSAPTimeline|null} The animation timeline
 */
export function createHomeRevealAnimation(container) {
  const namespace = container.dataset.barbaNamespace;
  
  if (namespace !== "home") return null;
  
  // Set initial hidden states
  gsap.set([
    ".nav_wrap",
    ".brand_logo",
    ".nav_link",
    ".home-category_text",
    ".home_hero_text",
    ".home-category_ref_text:not([hidden])",
    ".home-awards_list"
  ], {
    opacity: 0
  });
  
  gsap.set(".nav_wrap", { y: -20 });
  gsap.set(".brand_logo", { scale: 0.9 });
  gsap.set(".nav_link", { x: 20 });
  gsap.set(".home-category_text", { y: 15, rotateX: -45 });
  gsap.set(".home_hero_text", { x: -30, filter: "blur(4px)" });
  gsap.set(".home-category_ref_text:not([hidden])", { x: 20 });
  gsap.set(".home-awards_list", { y: 20, scale: 0.95 });
  
  const tl = gsap.timeline();
  
  // Nav wrapper
  tl.to(".nav_wrap", {
    opacity: 1, 
    y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  
  // Brand logo
  .to(".brand_logo", {
    opacity: 1, 
    scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5")
  
  // Nav links
  .to(".nav_link", {
    opacity: 1, 
    x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  
  // Category filters
  .to(".home-category_text", {
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power3.out"
  }, "-=0.5")
  
  // Project rows - animate visible ones
  .add(() => {
    const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
    visibleRows.forEach((row, index) => {
      const name = row.querySelector(".home_hero_text");
      const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (name) {
        gsap.to(name, {
          opacity: 1, 
          x: 0, 
          filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05
        });
      }
      
      if (tags.length) {
        gsap.to(tags, {
          opacity: 1, 
          x: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05,
          stagger: 0.02
        });
      }
    });
  }, "-=0.2")
  
  // Awards strip
  .to(".home-awards_list", {
    opacity: 1, 
    y: 0, 
    scale: 1,
    duration: 0.6,
    ease: "power3.out",
    delay: 0.3,
    onComplete: () => {
      // Clean up will-change
      gsap.set([
        ".nav_wrap",
        ".brand_logo",
        ".nav_link",
        ".home-category_text",
        ".home_hero_text",
        ".home-category_ref_text",
        ".home-awards_list"
      ], {
        clearProps: "transform,filter"
      });
    }
  });
  
  return tl;
}

/**
 * Animate navigation elements on project pages
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
  
  // Check if home page and run home reveal
  const homeReveal = createHomeRevealAnimation(container);
  if (homeReveal) return homeReveal;
  
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
  
  // For other pages, just ensure nav is visible
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