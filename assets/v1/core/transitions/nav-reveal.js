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
  
  // Category filters
  .to(".home-category_text", {
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    ...getAnimProps('categories')
  }, "-=0.5")
  
  // Project rows
  .add(() => {
    const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
    const rowProps = getAnimProps('projectRows');
    
    visibleRows.forEach((row, index) => {
      const name = row.querySelector(".home_hero_text");
      const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (name) {
        gsap.to(name, {
          opacity: 1, 
          x: 0, 
          filter: ANIMATION.FILTER.blurNone,
          duration: rowProps.duration,
          ease: rowProps.ease,
          delay: index * rowProps.stagger
        });
      }
      
      if (tags.length) {
        const tagProps = getAnimProps('tags');
        gsap.to(tags, {
          opacity: 1, 
          x: 0,
          duration: tagProps.duration,
          ease: tagProps.ease,
          delay: index * rowProps.stagger,
          stagger: tagProps.stagger
        });
      }
    });
  }, "-=0.2")
  
  // Awards strip
  .add(() => {
    const awardsList = container.querySelector(".home-awards_list");
    
    if (!awardsList) {
      console.warn("[NavReveal] Awards list not found");
      return;
    }
    
    const awardsItems = awardsList.querySelectorAll(":scope > *");
    
    if (awardsItems.length > 0) {
      gsap.fromTo(awardsItems, {
        opacity: 0, 
        y: ANIMATION.TRANSFORM.tagX, 
        scale: ANIMATION.TRANSFORM.scaleLarge 
      }, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.5,
        ease: "power3.out",
        stagger: {
          amount: 0.3,
          from: "start"
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
    // This prevents it from being visible while other elements animate
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
    
    // ✅ FIX: Animate navigation overlay with GSAP instead of CSS class
    if (navOverlay) {
      tl.to(navOverlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.4");
      console.log("[NavReveal] Navigation overlay will be revealed via GSAP");
    }
    
    return tl;
  }
  
  return null;
}