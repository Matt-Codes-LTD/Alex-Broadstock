// assets/v1/core/barba-bootstrap.js
import { initPageScripts, initGlobal } from "./page-scripts.js";
import { createSplitScreenTransition } from "./transitions/split-screen.js";
import { createProjectNavAnimation } from "./transitions/nav-reveal.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");
  
  // Track initial page load
  window.__initialPageLoad = true;
  
  // Initialize global features
  initGlobal();
  
  // Create split screen transition with nav reveal callback
  const splitScreenTransition = createSplitScreenTransition({
    onNavReveal: createProjectNavAnimation
  });
  
  // Track active cleanup function
  let activeCleanup = null;
  
  // Initialize Barba
  barba.init({
    transitions: [{
      name: "split-screen-transition",
      
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
      
      async leave(data) {
        // Run the split screen leave animation
        return await splitScreenTransition.leave(data);
      },
      
      async enter(data) {
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
        
        // Initialize new page scripts
        const newCleanup = initPageScripts(data.next.container);
        data.next.container.__cleanup = newCleanup;
        activeCleanup = newCleanup;
        
        // Run split screen enter animation with leave data
        // The leave method returns data that enter needs
        return await splitScreenTransition.enter(data, data.current.leaveResult);
      },
      
      // Store leave result for enter phase
      beforeLeave(data) {
        data.current.leaveResult = null;
      },
      
      afterLeave(data) {
        // The leave promise result gets stored here
        data.current.leaveResult = data.current.leavePromise;
      }
    }],
    prefetch: true,
    cacheIgnore: false,
    timeout: 10000,
    prevent: ({ el }) => {
      // Prevent Barba on external links, anchors, mailto, and tel links
      return el.hasAttribute('target') || 
             el.getAttribute('href')?.startsWith('#') ||
             el.getAttribute('href')?.startsWith('mailto:') ||
             el.getAttribute('href')?.startsWith('tel:');
    }
  });
  
  // Hook to capture leave data properly
  barba.hooks.leave((data) => {
    // Store the promise so we can pass its result to enter
    return new Promise(async (resolve) => {
      const leaveData = await splitScreenTransition.leave(data);
      data.current.leaveData = leaveData;
      resolve();
    });
  });
  
  barba.hooks.enter((data) => {
    // Use the stored leave data
    return splitScreenTransition.enter(data, data.current.leaveData);
  });
  
  // Handle browser back/forward with cleanup
  window.addEventListener('popstate', () => {
    if (activeCleanup) {
      try {
        activeCleanup();
        console.log("[Barba] Popstate cleanup complete");
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
        console.log("[Barba] Unload cleanup complete");
      } catch (err) {
        console.warn("[Barba] Unload cleanup error:", err);
      }
      activeCleanup = null;
    }
  });
  
  console.log("[Barba] init complete with split-screen transition");
});