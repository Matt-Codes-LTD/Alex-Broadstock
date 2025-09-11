import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  barba.init({
    transitions: [
      {
        name: "view-transition-exact",

        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          
          // Ensure initial page is fully visible
          gsap.set(main, { 
            opacity: 1, 
            scale: 1
          });
        },

        leave({ current }) {
          // Cleanup previous page scripts
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          
          // Don't animate here - we'll handle both in enter()
          return Promise.resolve();
        },

        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          // Initialize scripts for new page
          newMain.__cleanup = initPageScripts(newMain);

          // Position both containers for overlay
          Object.assign(oldMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "1"
          });
          
          Object.assign(newMain.style, { 
            position: "absolute", 
            inset: "0", 
            zIndex: "2"
          });

          // Create timeline for parallel animations
          const tl = gsap.timeline({
            onComplete: () => {
              // Clean up after animation
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              
              if (oldMain && oldMain.parentNode) {
                oldMain.remove();
              }
              
              window.scrollTo(0, 0);
            }
          });

          // EXACT REPLICATION OF VIEW TRANSITION ANIMATIONS
          
          // 1. Old page animation (::view-transition-old)
          // Animates from opacity: 1, scale: 1 TO opacity: 0, scale: 0.5
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              transformOrigin: "50% 50%"
            },
            {
              opacity: 0,
              scale: 0.5,
              duration: 2,
              ease: "cubic-bezier(0.87, 0, 0.13, 1)",
              transformOrigin: "50% 50%"
            }, 
            0 // Start at time 0
          );

          // 2. New page animation (::view-transition-new)
          // Animates from circle(0%) TO circle(75%)
          tl.fromTo(newMain,
            {
              clipPath: "circle(0% at 50% 50%)",
              opacity: 1,
              scale: 1
            },
            {
              clipPath: "circle(75% at 50% 50%)",
              duration: 2,
              ease: "cubic-bezier(0.87, 0, 0.13, 1)"
            },
            0 // Start at time 0 (simultaneous with old page animation)
          );

          return tl;
        }
      }
    ]
  });
});