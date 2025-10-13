// assets/v1/core/barba-bootstrap.js - SIMPLIFIED VERSION
import { initPageScripts, initGlobal } from "./page-scripts.js";
import { createSplitScreenTransition } from "./transitions/split-screen.js";
import { createProjectNavAnimation } from "./transitions/nav-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");
  
  // Track initial page load
  window.__initialPageLoad = true;
  
  // Initialize global features
  initGlobal();
  
  // Create split screen transition
  const transition = createSplitScreenTransition({
    onNavReveal: createProjectNavAnimation
  });
  
  // Track active cleanup function
  let activeCleanup = null;
  
  // Initialize Barba
  barba.init({
    transitions: [{
      name: "split-screen",
      
      once({ next }) {
        const main = next.container;
        
        // Initialize page scripts
        activeCleanup = initPageScripts(main);
        main.__cleanup = activeCleanup;
        
        // Ensure visibility
        gsap.set(main, { opacity: 1, scale: 1 });
        
        // Animate nav on initial page load
        createProjectNavAnimation(main);
        
        // Clear the initial load flag
        setTimeout(() => {
          window.__initialPageLoad = false;
        }, 100);
      },
      
      leave: transition.leave,
      enter: transition.enter,
      
      beforeEnter({ next }) {
        // Clean up old page scripts
        if (activeCleanup) {
          try {
            activeCleanup();
            console.log("[Barba] Cleanup complete");
          } catch (err) {
            console.warn("[Barba] Cleanup error:", err);
          }
          activeCleanup = null;
        }
        
        // Initialize new page scripts
        const newCleanup = initPageScripts(next.container);
        next.container.__cleanup = newCleanup;
        activeCleanup = newCleanup;
      }
    }],
    prefetch: true,
    cacheIgnore: false,
    timeout: 10000,
    prevent: ({ el }) => {
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
  });
  
  console.log("[Barba] initialized with split-screen transition");
});