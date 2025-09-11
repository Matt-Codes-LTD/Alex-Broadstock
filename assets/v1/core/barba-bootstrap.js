import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  barba.init({
    transitions: [
      {
        name: "dynamic-view-transition",

        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          
          gsap.set(main, { 
            opacity: 1, 
            scale: 1
          });
        },

        leave({ current }) {
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          return Promise.resolve();
        },

        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          newMain.__cleanup = initPageScripts(newMain);

          // Position containers
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

          const tl = gsap.timeline({
            onComplete: () => {
              newMain.style.position = "";
              newMain.style.inset = "";
              newMain.style.zIndex = "";
              
              if (oldMain && oldMain.parentNode) {
                oldMain.remove();
              }
              
              window.scrollTo(0, 0);
            }
          });
          
          /*
          // DYNAMIC VERSION 1: Asymmetric rectangle with rotation
          // Uncomment this version for a tilted, asymmetric reveal
          
          // Old page: Scale down with slight rotation and shift
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              transformOrigin: "50% 50%"
            },
            {
              opacity: 0,
              scale: 0.5,
              rotate: -5,
              x: "-10%",
              duration: 1.8,
              ease: "power3.inOut",
              transformOrigin: "50% 50%"
            }, 
            0
          );

          // New page: Diagonal wipe with perspective
          tl.fromTo(newMain,
            {
              clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)", // Start from right edge
              opacity: 1,
              scale: 1
            },
            {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // Reveal from right to left
              duration: 1.4,
              ease: "power4.inOut"
            },
            0.3 // Slight delay for overlap effect
          );
          */
          

          // DYNAMIC VERSION 2: Multi-stage animation with momentum
          // Comment out Version 1 and uncomment this for a different effect
          
          // Old page: Elastic scale with blur
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              transformOrigin: "50% 50%"
            },
            {
              opacity: 0,
              scale: 0.3,
              filter: "blur(10px)",
              duration: 1.5,
              ease: "back.in(1.7)",
              transformOrigin: "50% 50%"
            }, 
            0
          );

          // New page: Growing rectangle with overshoot
          tl.fromTo(newMain,
            {
              clipPath: "inset(48% 48% 48% 48%)", // Tiny square
              scale: 0.95,
              opacity: 1
            },
            {
              clipPath: "inset(0% 0% 0% 0%)", // Full viewport
              scale: 1,
              duration: 1.8,
              ease: "elastic.out(1, 0.5)"
            },
            0.2
          );
          

          // DYNAMIC VERSION 3: Staggered panels effect
          // Comment out other versions and uncomment this for panel reveal
          /*
          // Old page: Shrink to center with twist
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              transformOrigin: "50% 50%",
              transformPerspective: 1000
            },
            {
              opacity: 0,
              scale: 0.6,
              rotateY: -45,
              duration: 1.6,
              ease: "power4.in",
              transformOrigin: "50% 50%"
            }, 
            0
          );

          // New page: Split screen reveal (top and bottom)
          tl.fromTo(newMain,
            {
              clipPath: "polygon(0% 45%, 100% 45%, 100% 55%, 0% 55%)", // Horizontal line
              opacity: 1,
              scale: 1
            },
            {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // Full screen
              duration: 1.4,
              ease: "expo.out"
            },
            0.3
          );
          */

          // DYNAMIC VERSION 4: Cinematic wipe with motion
          // Comment out other versions and uncomment this for cinematic effect
          /*
          // Old page: Zoom out with fade
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              transformOrigin: "50% 50%"
            },
            {
              opacity: 0,
              scale: 1.5,
              duration: 1.2,
              ease: "power2.in",
              transformOrigin: "50% 50%"
            }, 
            0
          );

          // New page: Cinematic bars that open up
          tl.fromTo(newMain,
            {
              clipPath: "inset(25% 0% 25% 0%)", // Letterbox/cinematic bars
              scale: 1.1,
              opacity: 1
            },
            {
              clipPath: "inset(0% 0% 0% 0%)", // Full viewport
              scale: 1,
              duration: 1.8,
              ease: "power3.out"
            },
            0.4
          );

          // Add a subtle bounce at the end
          tl.to(newMain, {
            scale: 1.02,
            duration: 0.2,
            ease: "power2.out"
          })
          .to(newMain, {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.8)"
          });
          */

          // DYNAMIC VERSION 5: Advanced with multiple properties
          // Comment out other versions and uncomment this for the most dynamic effect
          /*
          // Create overlay element for additional effects
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%);
            z-index: 3;
            pointer-events: none;
          `;
          document.body.appendChild(overlay);

          // Old page: Complex exit animation
          tl.fromTo(oldMain, 
            {
              opacity: 1,
              scale: 1,
              rotate: 0,
              skewY: 0,
              transformOrigin: "50% 100%"
            },
            {
              opacity: 0,
              scale: 0.7,
              rotate: 2,
              skewY: -5,
              y: -50,
              duration: 1.3,
              ease: "power4.in",
              transformOrigin: "50% 100%"
            }, 
            0
          );

          // Overlay flash effect
          tl.fromTo(overlay,
            {
              opacity: 0
            },
            {
              opacity: 1,
              duration: 0.3,
              ease: "power2.in"
            },
            0.8
          )
          .to(overlay, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => overlay.remove()
          });

          // New page: Dynamic rectangle reveal with rotation
          tl.fromTo(newMain,
            {
              clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", // Point in center
              scale: 0.9,
              rotate: -2,
              opacity: 1
            },
            {
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // Full rectangle
              scale: 1,
              rotate: 0,
              duration: 1.5,
              ease: "expo.out"
            },
            0.9
          );
          */

          return tl;
        }
      }
    ]
  });

  // Optional: Register custom eases for more unique motion
  gsap.registerEase("customBounce", function(progress) {
    if (progress < 0.4) {
      return 2.5 * progress * progress;
    } else if (progress < 0.7) {
      return 1 - Math.pow(-2 * progress + 2, 2) / 2;
    } else {
      return 1 + 0.3 * Math.sin((progress - 0.7) * 10) * (1 - progress);
    }
  });
});