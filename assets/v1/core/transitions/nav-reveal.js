// assets/v1/core/transitions/nav-reveal.js
// FIXED: Project navigation overlay now properly animated with GSAP
import { ANIMATION, getAnimProps } from "../animation-constants.js";

/**
 * Animate navigation and content on home page
 */
export function createHomeRevealAnimation(container) {
  const namespace = container.dataset.barbaNamespace;
  
  if (namespace !== "home") return null;
  
  // Don't animate if site-loader is handling initial reveal
  const hasSiteLoader = document.querySelector(".site-loader_wrap[data-script-initialized='true']");
  if (hasSiteLoader && window.__initialPageLoad) {
    console.log("[NavReveal] Skipping - site loader will handle reveal");
    return null;
  }
  
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
  
  gsap.set(".nav_wrap", { y: ANIMATION.TRANSFORM.navY });
  gsap.set(".brand_logo", { scale: ANIMATION.TRANSFORM.scaleSmall });
  gsap.set(".nav_link", { x: ANIMATION.TRANSFORM.tagX });
  gsap.set(".home-category_text", { 
    y: ANIMATION.TRANSFORM.textY, 
    rotateX: ANIMATION.TRANSFORM.rotateX 
  });
  gsap.set(".home_hero_text", { 
    x: ANIMATION.TRANSFORM.textX, 
    filter: ANIMATION.FILTER.blur 
  });
  gsap.set(".home-category_ref_text:not([hidden])", { x: ANIMATION.TRANSFORM.tagX });
  gsap.set(".home-awards_list", { 
    y: ANIMATION.TRANSFORM.tagX, 
    scale: ANIMATION.TRANSFORM.scaleLarge 
  });
  
  const tl = gsap.timeline();
  
  // Nav wrapper
  tl.to(".nav_wrap", {
    opacity: 1, 
    y: 0,
    ...getAnimProps('nav')
  })
  
  // Brand logo
  .to(".brand_logo", {
    opacity: 1, 
    scale: 1,
    ...getAnimProps('brand')
  }, "-=0.5")
  
  // Nav links
  .to(".nav_link", {
    opacity: 1, 
    x: 0,
    ...getAnimProps('navLinks')
  }, "-=0.4")
  
  // Category text
  .to(".home-category_text", {
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    ...getAnimProps('categoryText')
  }, "-=0.3")
  
  // Hero text
  .to(".home_hero_text", {
    opacity: 1, 
    x: 0, 
    filter: "none",
    ...getAnimProps('heroText')
  }, "-=0.5")
  
  // Category refs
  .to(".home-category_ref_text:not([hidden])", {
    opacity: 1, 
    x: 0,
    ...getAnimProps('categoryRefs')
  }, "-=0.3")
  
  // Awards list
  .add(() => {
    const awardsList = document.querySelector(".home-awards_list");
    if (!awardsList) return;
    
    const hasChildren = awardsList.children.length > 0;
    
    if (hasChildren && ScrollTrigger) {
      awardsList.querySelectorAll(":scope > *").forEach((child, i) => {
        gsap.fromTo(child, 
          { opacity: 0, y: 20, scale: 1.1 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            delay: i * 0.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: child,
              start: "top 85%",
              once: true
            }
          }
        );
      });
      
      gsap.to(awardsList, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: awardsList,
          start: "top 85%",
          once: true
        },
        delay: 0.3
      });
    } else {
      gsap.to(awardsList, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.3
      });
    }
  }, "-=0.2")
  
  // Clear props
  .add(() => {
    gsap.set([
      ".nav_wrap",
      ".brand_logo",
      ".nav_link",
      ".home-category_text",
      ".home_hero_text",
      ".home-category_ref_text",
      ".home-awards_list",
      ".home-awards_list > *"
    ], {
      clearProps: "transform,filter"
    });
  });
  
  return tl;
}

/**
 * Animate navigation elements on project pages
 */
export function createProjectNavAnimation(container) {
  const namespace = container.dataset.barbaNamespace;
  
  // Check if home page and run home reveal
  const homeReveal = createHomeRevealAnimation(container);
  if (homeReveal) return homeReveal;
  
  // Don't force nav visibility if site-loader is handling initial load
  const hasSiteLoader = document.querySelector(".site-loader_wrap[data-script-initialized='true']");
  if (!hasSiteLoader || !window.__initialPageLoad) {
    gsap.set(".nav_wrap", {
      visibility: "visible",
      opacity: 1
    });
    
    gsap.set(".nav_link", {
      visibility: "visible",
      opacity: 1
    });
  }
  
  // Only animate project-specific elements on project pages
  if (namespace === "project") {
    console.log("[NavReveal] Setting up project page animations");
    
    // CRITICAL: Hide navigation overlay IMMEDIATELY before any animations
    const navOverlay = container.querySelector(".project-navigation_overlay");
    if (navOverlay) {
      gsap.set(navOverlay, {
        opacity: 0,
        visibility: "visible"
      });
      console.log("[NavReveal] Navigation overlay hidden initially");
    }
    
    // Set initial hidden states - DON'T hide parent containers, only children
    gsap.set([
      ".project_name",
      ".project-player_center-toggle",
      ".project-player_btn--play", 
      ".project-player_timeline",
      ".project-player_btn--mute", 
      ".project-player_btn--fs"
    ], {
      opacity: 0,
      visibility: "visible"
    });
    
    const tl = gsap.timeline();
    
    // Nav wrapper
    tl.fromTo(".nav_wrap", {
      opacity: 0,
      y: ANIMATION.TRANSFORM.navY
    }, {
      opacity: 1,
      y: 0,
      ...getAnimProps('nav')
    })
    
    // Links and project name
    .fromTo([".nav_link", ".project_name"], {
      opacity: 0,
      x: ANIMATION.TRANSFORM.tagX
    }, {
      opacity: 1,
      x: 0,
      ...getAnimProps('navLinks')
    }, "-=0.4")
    
    // Center button
    .fromTo(".project-player_center-toggle", {
      opacity: 0,
      scale: ANIMATION.TRANSFORM.scaleSmall
    }, {
      opacity: 1,
      scale: 1,
      ...getAnimProps('brand')
    }, "-=0.3")
    
    // Player controls (individual buttons, not parent container)
    .fromTo([
      ".project-player_btn--play", 
      ".project-player_timeline",
      ".project-player_btn--mute", 
      ".project-player_btn--fs"
    ], {
      opacity: 0,
      y: 5
    }, {
      opacity: 1,
      y: 0,
      ...getAnimProps('playerButtons')
    }, "-=0.4");
    
    // FIX: Force navigation overlay to show using multiple methods
    if (navOverlay) {
      tl.to(navOverlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
        immediateRender: true,
        force3D: true,
        onStart: () => {
          // Ensure visibility
          navOverlay.style.visibility = 'visible';
        },
        onComplete: () => {
          // Force override any !important CSS
          navOverlay.style.setProperty('opacity', '1', 'important');
          navOverlay.classList.add('is-revealed');
          console.log("[NavReveal] Navigation overlay revealed");
        }
      }, "-=0.4");
    }
    
    return tl;
  }
  
  return null;
}