// assets/v1/core/barba-bootstrap.js - Updated with wipe transition
import { initPageScripts, initGlobal } from "./page-scripts.js";
import { createSimpleWipeTransition } from "./transitions/simple-wipe.js";
import { createProjectNavAnimation } from "./transitions/nav-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");
  
  // Track initial page load
  window.__initialPageLoad = true;
  
  // Initialize global features
  initGlobal();
  
  // Create simple wipe transition
  const wipeTransition = createSimpleWipeTransition({
    onNavReveal: createProjectNavAnimation
  });
  
  // Track active cleanup function
  let activeCleanup = null;
  
  // Initialize Barba
  barba.init({
    transitions: [{
      name: "wipe-transition",
      
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
        // Run the wipe out
        await wipeTransition.leave({ current });
      },
      
      async enter({ current, next }) {
        // Clean up old page scripts
        if (activeCleanup) {
          try {
            activeCleanup();
            console.log("[Barba] Old container cleanup complete");
          } catch (err) {
            console.warn("[Barba] Cleanup error:", err);
          }
          activeCleanup = null;
        }
        
        // Initialize new page
        const newCleanup = initPageScripts(next.container);
        next.container.__cleanup = newCleanup;
        activeCleanup = newCleanup;
        
        // Run wipe reveal
        return wipeTransition.enter({ current, next });
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
  });
});