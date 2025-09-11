import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  barba.init({
    transitions: [
      {
        name: "view-transition-recreation",

        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          
          // Ensure the initial page is fully visible
          gsap.set(main, { 
            opacity: 1, 
            scale: 1,
            clipPath: "circle(100% at 50% 50%)"
          });
        },

        leave({ current }) {
          // Cleanup previous page scripts
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          
          // Animate the old page out (scale down and fade)
          // This replicates the ::view-transition-old animation
          return gsap.to(current.container, {
            opacity: 0,
            scale: 0.5,
            duration: 2,
            ease: "cubic-bezier(0.87, 0, 0.13, 1)",
            transformOrigin: "50% 50%"
          });
        },

        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          // Initialize scripts for the new page
          newMain.__cleanup = initPageScripts(newMain);

          // Position both containers absolutely for smooth transition
          Object.assign(oldMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "1",
            width: "100%",
            height: "100%"
          });
          
          Object.assign(newMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "2",
            width: "100%",
            height: "100%"
          });

          // Set initial state for new page (hidden with small clip-path)
          gsap.set(newMain, {
            clipPath: "circle(0% at 50% 50%)",
            opacity: 1,
            scale: 1,
            transformOrigin: "50% 50%"
          });

          // Create timeline for synchronized animations
          const tl = gsap.timeline({
            onComplete: () => {
              // Clean up styles after animation
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              newMain.style.width = "";
              newMain.style.height = "";
              
              // Remove old container
              if (oldMain && oldMain.parentNode) {
                oldMain.remove();
              }
              
              // Reset scroll position
              window.scrollTo(0, 0);
            }
          });

          // Animate the new page in with circular reveal
          // This replicates the ::view-transition-new animation
          tl.to(newMain, {
            clipPath: "circle(75% at 50% 50%)",
            duration: 2,
            ease: "cubic-bezier(0.87, 0, 0.13, 1)"
          }, 0);

          // Optional: Add a final expansion to fully reveal the page
          // This ensures no content is clipped at the edges
          tl.to(newMain, {
            clipPath: "circle(100% at 50% 50%)",
            duration: 0.3,
            ease: "power2.out"
          });

          return tl;
        },

        // Alternative implementation with overlapping animations
        // Uncomment this and comment out the above enter() if you want
        // the animations to overlap more closely to the original
        /*
        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          newMain.__cleanup = initPageScripts(newMain);

          // Position containers
          Object.assign(oldMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "2", // Old page on top initially
            width: "100%",
            height: "100%"
          });
          
          Object.assign(newMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "1", // New page underneath
            width: "100%",
            height: "100%"
          });

          // Set initial states
          gsap.set(newMain, {
            clipPath: "circle(0% at 50% 50%)",
            opacity: 1,
            scale: 1
          });

          const tl = gsap.timeline({
            onComplete: () => {
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              newMain.style.width = "";
              newMain.style.height = "";
              if (oldMain && oldMain.parentNode) oldMain.remove();
              window.scrollTo(0, 0);
            }
          });

          // Both animations run simultaneously
          // Old page scales down and fades
          tl.to(oldMain, {
            opacity: 0,
            scale: 0.5,
            duration: 2,
            ease: "cubic-bezier(0.87, 0, 0.13, 1)",
            transformOrigin: "50% 50%"
          }, 0);

          // New page reveals with circular clip-path
          tl.to(newMain, {
            clipPath: "circle(75% at 50% 50%)",
            duration: 2,
            ease: "cubic-bezier(0.87, 0, 0.13, 1)"
          }, 0);

          // Fully expand clip-path
          tl.to(newMain, {
            clipPath: "circle(100% at 50% 50%)",
            duration: 0.3,
            ease: "power2.out"
          }, 2);

          return tl;
        }
        */
      },
    ],

    // Optional: Add custom debug mode
    debug: false,
    
    // Prevent default link behavior
    preventRunning: false,
    
    // Schema for detecting barba containers
    schema: {
      prefix: "data-barba",
      wrapper: "wrapper",
      container: "container",
      namespace: "namespace"
    }
  });

  // Optional: Add support for custom easing if needed
  // GSAP doesn't directly support cubic-bezier strings, so we can create a custom ease
  gsap.registerEase("viewTransitionEase", function(progress) {
    // This approximates cubic-bezier(0.87, 0, 0.13, 1)
    // You can also use CustomEase plugin for exact cubic-bezier conversion
    return 1 - Math.pow(1 - progress, 3.5);
  });
});

// Enhanced version with additional features (optional)
/*
// If you want to add more control and customization options:

const VIEW_TRANSITION_CONFIG = {
  duration: 2, // Duration in seconds
  oldPageScale: 0.5, // Scale factor for old page
  newPageCircleSize: "75%", // Circle size for new page reveal
  easing: "cubic-bezier(0.87, 0, 0.13, 1)",
  expandToFull: true, // Whether to expand clip-path to 100%
  expandDuration: 0.3 // Duration for final expansion
};

// You can then use these config values in your transition:
// scale: VIEW_TRANSITION_CONFIG.oldPageScale,
// duration: VIEW_TRANSITION_CONFIG.duration,
// etc.
*/

// Fallback for browsers that don't support clip-path
// (though modern browser support is quite good)
/*
function supportsClipPath() {
  const el = document.createElement('div');
  el.style.clipPath = 'circle(50% at 50% 50%)';
  return el.style.clipPath !== '';
}

if (!supportsClipPath()) {
  // Fallback animation using scale and opacity only
  console.warn('[Barba] clip-path not supported, using fallback animation');
  // Implement alternative animation strategy
}
*/