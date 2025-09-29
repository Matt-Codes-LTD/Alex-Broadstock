// barba-bootstrap.js - Fixed with proper cleanup
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
        // Run cleanup before leaving
        if (activeCleanup) {
          try {
            activeCleanup();
          } catch (err) {
            console.warn("[Barba] Leave cleanup error:", err);
          }
          activeCleanup = null;
        }
        
        await gridTransition.leave(current);
      },
      
      async enter({ current, next }) {
        // Initialize new page
        activeCleanup = initPageScripts(next.container);
        next.container.__cleanup = activeCleanup;
        
        return gridTransition.enter(current, next);
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