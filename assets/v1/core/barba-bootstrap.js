// barba-bootstrap.js - Simplified orchestrator
import { initPageScripts, initGlobal } from "./page-scripts.js";
import { createGridTransition } from "./transitions/grid-transition.js";
import { createProjectNavAnimation } from "./transitions/nav-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");
  
  // Track initial page load
  window.__initialPageLoad = true;
  
  // Initialize global features
  initGlobal();
  
  // Create transition system
  const gridTransition = createGridTransition({
    cols: 20,
    rows: 12,
    onNavReveal: createProjectNavAnimation
  });
  
  // Initialize Barba
  barba.init({
    transitions: [{
      name: "grid-stagger-transition",
      
      once({ next }) {
        const main = next.container;
        main.__cleanup = initPageScripts(main);
        
        gsap.set(main, { 
          opacity: 1, 
          scale: 1
        });
        
        // Animate nav on initial page load if it's a project page
        createProjectNavAnimation(main);
        
        // Clear the initial load flag
        setTimeout(() => {
          window.__initialPageLoad = false;
        }, 100);
      },
      
      async leave({ current }) {
        await gridTransition.leave(current);
      },
      
      async enter({ current, next }) {
        return gridTransition.enter(current, next);
      }
    }],
    prefetch: true,
    cacheIgnore: false
  });
});