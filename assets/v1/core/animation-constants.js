// assets/v1/core/animation-constants.js
// Centralized animation timing for consistent feel across all pages

export const ANIMATION = {
  // Easing curves
  EASE: {
    nav: "power3.out",           // Smooth deceleration for nav elements
    brand: "back.out(1.2)",      // Slight bounce for logo
    text: "power2.out",          // Standard text reveals
    controls: "power2.out",      // Player controls
    fade: "power3.out"           // Gentle fades
  },
  
  // Durations (in seconds)
  DURATION: {
    nav: 0.8,                    // Nav wrapper
    brand: 0.6,                  // Brand logo
    text: 0.5,                   // Text elements
    controls: 0.5,               // Player controls
    controlsShort: 0.35,         // Individual buttons
    fade: 0.6                    // Opacity changes
  },
  
  // Stagger timings (in seconds)
  STAGGER: {
    navLinks: 0.08,              // Between nav links
    categories: 0.05,            // Between category buttons
    projects: 0.05,              // Between project rows
    tags: 0.02,                  // Between project tags
    controls: 0.06               // Between player controls
  },
  
  // Delays (in seconds)
  DELAY: {
    initial: 0.3,                // Initial breathing room
    sequential: 0.1,             // Between animation groups
    awards: 0.3                  // Awards strip delay
  },
  
  // Transform values
  TRANSFORM: {
    navY: -20,                   // Nav slide distance
    textY: 15,                   // Text slide distance
    textX: -30,                  // Project name slide
    tagX: 20,                    // Tag slide distance
    controlY: 10,                // Control slide distance
    scaleSmall: 0.9,             // Small scale start
    scaleLarge: 0.95,            // Large scale start
    rotateX: -45                 // Text rotation
  },
  
  // Filter values
  FILTER: {
    blur: "blur(4px)",           // Initial blur
    blurNone: "blur(0px)"        // Clear state
  }
};

// Helper function to get consistent animation props
export function getAnimProps(type) {
  switch(type) {
    case 'nav':
      return {
        duration: ANIMATION.DURATION.nav,
        ease: ANIMATION.EASE.nav
      };
    case 'brand':
      return {
        duration: ANIMATION.DURATION.brand,
        ease: ANIMATION.EASE.brand
      };
    case 'navLinks':
      return {
        duration: ANIMATION.DURATION.text,
        stagger: ANIMATION.STAGGER.navLinks,
        ease: ANIMATION.EASE.text
      };
    case 'categories':
      return {
        duration: ANIMATION.DURATION.fade,
        stagger: ANIMATION.STAGGER.categories,
        ease: ANIMATION.EASE.fade
      };
    case 'projectRows':
      return {
        duration: ANIMATION.DURATION.text,
        stagger: ANIMATION.STAGGER.projects,
        ease: ANIMATION.EASE.text
      };
    case 'tags':
      return {
        duration: ANIMATION.DURATION.text,
        stagger: ANIMATION.STAGGER.tags,
        ease: ANIMATION.EASE.text
      };
    case 'playerControls':
      return {
        duration: ANIMATION.DURATION.controls,
        ease: ANIMATION.EASE.controls
      };
    case 'playerButtons':
      return {
        duration: ANIMATION.DURATION.controlsShort,
        stagger: ANIMATION.STAGGER.controls,
        ease: ANIMATION.EASE.controls
      };
    case 'awards':
      return {
        duration: ANIMATION.DURATION.fade,
        ease: ANIMATION.EASE.fade,
        delay: ANIMATION.DELAY.awards
      };
    default:
      return {
        duration: ANIMATION.DURATION.text,
        ease: ANIMATION.EASE.text
      };
  }
}