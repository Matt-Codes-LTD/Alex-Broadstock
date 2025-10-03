// site-loader/reveal-animations.js - Hero content reveal animations
import { CONFIG } from "./constants.js";

export function revealHeroContent(container) {
  // Set visibility
  gsap.set([
    ".nav_wrap",
    ".home_hero_categories",
    ".home-hero_menu",
    ".home-awards_list"
  ], {
    visibility: "visible",
    opacity: 1
  });
  
  gsap.set([
    ".brand_logo",
    ".nav_link",
    ".home-category_text"
  ], {
    visibility: "visible"
  });
  
  // Keep project elements hidden
  gsap.set([
    ".home_hero_text",
    ".home-category_ref_text:not([hidden])",
    ".home-awards_list"
  ], {
    opacity: 0
  });
  
  // Create reveal timeline
  const tl = gsap.timeline();
  
  // Nav wrapper
  tl.fromTo(".nav_wrap", {
    opacity: 0, y: -20
  }, {
    opacity: 1, y: 0,
    duration: 0.8,
    ease: "power3.out"
  });
  
  // Brand logo
  tl.fromTo(".brand_logo", {
    opacity: 0, scale: 0.9
  }, {
    opacity: 1, scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5");
  
  // Nav links
  tl.fromTo(".nav_link", {
    opacity: 0, x: 20
  }, {
    opacity: 1, x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4");
  
  // Categories
  tl.fromTo(".home-category_text", {
    opacity: 0, y: 15, rotateX: -45
  }, {
    opacity: 1, y: 0, rotateX: 0,
    duration: 0.6,
    stagger: CONFIG.ANIMATION.heroRevealStagger,
    ease: "power3.out"
  }, "-=0.5");
  
  // Project rows
  tl.add(() => revealProjectRows(container), "-=0.2");
  
  // ✨ AWARDS - SMOOTH ITEM STAGGER (FIXED - Fallback to parent)
  tl.add(() => {
    const awardsList = container.querySelector(".home-awards_list");
    
    if (!awardsList) {
      console.warn("[RevealAnimations] Awards list not found");
      return;
    }
    
    const awardsItems = awardsList.querySelectorAll(":scope > *");
    
    // If CMS items exist, animate them individually
    if (awardsItems.length > 0) {
      console.log("[RevealAnimations] Animating", awardsItems.length, "award items");
      
      gsap.fromTo(awardsItems, {
        opacity: 0, 
        y: 20, 
        scale: 0.95
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
        delay: 0.3,
        onComplete: clearProps
      });
    } else {
      // Fallback: animate parent container if CMS items not loaded yet
      console.log("[RevealAnimations] No award items found, animating parent container");
      
      gsap.fromTo(awardsList, {
        opacity: 0,
        y: 20,
        scale: 0.95
      }, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.3,
        onComplete: clearProps
      });
    }
  }, "-=0.2");
  
  return tl;
}

export function revealProjectRows(container) {
  const rows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
  
  rows.forEach((row, index) => {
    const name = row.querySelector(".home_hero_text");
    const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
    
    if (name) {
      gsap.fromTo(name, {
        opacity: 0, x: -30, filter: "blur(4px)"
      }, {
        opacity: 1, x: 0, filter: "blur(0px)",
        duration: 0.5,
        ease: "power2.out",
        delay: index * CONFIG.ANIMATION.heroRevealStagger
      });
    }
    
    if (tags.length) {
      gsap.fromTo(tags, {
        opacity: 0, x: 20
      }, {
        opacity: 1, x: 0,
        duration: 0.5,
        ease: "power2.out",
        delay: index * CONFIG.ANIMATION.heroRevealStagger,
        stagger: 0.02
      });
    }
  });
}

export function clearProps() {
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
}

export function prepareHeroStage(heroContainer) {
  if (heroContainer) {
    gsap.set(heroContainer, { opacity: 1, zIndex: 0 });
  }
}