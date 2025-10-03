// assets/v1/core/animation-constants.js
// Centralized animation timing for consistent feel across all pages

export const ANIMATION = {
  // Easing curves
  EASE: {
    nav: "power3.out",
    brand: "back.out(1.2)",
    text: "power2.out",
    controls: "power2.out",
    fade: "power3.out"
  },
  
  // Durations (in seconds) - FASTER
  DURATION: {
    nav: 0.5,              // Was 0.8
    brand: 0.4,            // Was 0.6
    text: 0.35,            // Was 0.5
    controls: 0.35,        // Was 0.5
    controlsShort: 0.25,   // Was 0.35
    fade: 0.4              // Was 0.6
  },
  
  // Stagger timings (in seconds) - TIGHTER
  STAGGER: {
    navLinks: 0.04,        // Was 0.08
    categories: 0.03,      // Was 0.05
    projects: 0.03,        // Was 0.05
    tags: 0.01,            // Was 0.02
    controls: 0.04         // Was 0.06
  },
  
  // Delays (in seconds) - REDUCED
  DELAY: {
    initial: 0.15,         // Was 0.3
    sequential: 0.05,      // Was 0.1
    awards: 0.15           // Was 0.3
  },
  
  // Transform values
  TRANSFORM: {
    navY: -20,
    textY: 15,
    textX: -30,
    tagX: 20,
    controlY: 10,
    scaleSmall: 0.9,
    scaleLarge: 0.95,
    rotateX: -45
  },
  
  // Filter values
  FILTER: {
    blur: "blur(4px)",
    blurNone: "blur(0px)"
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