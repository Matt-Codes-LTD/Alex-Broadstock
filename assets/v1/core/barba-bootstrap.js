// barba-bootstrap.js - Fixed with deferred cleanup
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
  
  // Track active cleanup function
  let activeCleanup = null;
  
  // Initialize Barba
  barba.init({
    transitions: [{
      name: "grid-stagger-transition",
      
      once({ next }) {
        const main = next.container;
        
        // Initialize page scripts
        activeCleanup = initPageScripts(main);
        main.__cleanup = activeCleanup;
        
        // Ensure visibility
        if (window.gsap) {
          gsap.set(main, { opacity: 1, scale: 1 });
        } else {
          main.style.opacity = "1";
          main.style.transform = "scale(1)";
        }
        
        // Animate nav on initial page load if it's a project page
        createProjectNavAnimation(main);
        
        // Clear the initial load flag
        setTimeout(() => {
          window.__initialPageLoad = false;
        }, 100);
      },
      
      async leave({ current }) {
        // DON'T run cleanup here - videos need to stay visible
        // Just run the grid animation
        await gridTransition.leave(current);
      },
      
      async enter({ current, next }) {
        // Pass the old cleanup to the transition so it can run it at the right time
        const oldCleanup = activeCleanup;
        activeCleanup = null;
        
        // Initialize new page
        const newCleanup = initPageScripts(next.container);
        next.container.__cleanup = newCleanup;
        
        // Run transition and pass old cleanup to be called after grid covers screen
        return gridTransition.enter(current, next, oldCleanup).then(() => {
          activeCleanup = newCleanup;
        });
      }
    }],
    prefetch: true,
    cacheIgnore: false,
    timeout: 10000,
    prevent: ({ el }) => {
      // Prevent Barba on external links and anchors
      return el.hasAttribute('target') || 
             el.getAttribute('href')?.startsWith('#') ||
             el.getAttribute('href')?.startsWith('mailto:') ||
             el.getAttribute('href')?.startsWith('tel:');
    }
  });
  
  // Handle browser back/forward with cleanup
  window.addEventListener('popstate', () => {
    if (activeCleanup) {
      try {
        activeCleanup();
      } catch (err) {
        console.warn("[Barba] Popstate cleanup error:", err);
      }
      activeCleanup = null;
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (activeCleanup) {
      try {
        activeCleanup();
      } catch (err) {
        console.warn("[Barba] Unload cleanup error:", err);
      }
      activeCleanup = null;
    }
    
    // Clean up transition grid
    if (gridTransition.cleanup) {
      gridTransition.cleanup();
    }
    
    // Clean up global cursor if it has cleanup
    if (window.__cursorCleanup) {
      window.__cursorCleanup();
    }
  });
});