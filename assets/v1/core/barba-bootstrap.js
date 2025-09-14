// barba-bootstrap.js - Grid transition with glass effect

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  // Create the transition grid overlay
  const createTransitionGrid = () => {
    const grid = document.createElement('div');
    grid.className = 'transition-grid';
    
    // Create exactly 110 divs (CSS handles all styling)
    for (let i = 0; i < 110; i++) {
      const div = document.createElement('div');
      grid.appendChild(div);
    }
    
    document.body.appendChild(grid);
    return grid;
  };

  // Initialize the grid but keep it hidden
  const transitionGrid = createTransitionGrid();

  // Register custom ease that matches 'o4' from the original
  gsap.registerEase("o4", function(progress) {
    return 1 - Math.pow(1 - progress, 4);
  });

  barba.init({
    transitions: [
      {
        name: "grid-stagger-transition",

        once({ next }) {
          const main = next.container;
          main.__cleanup = initPageScripts(main);
          
          gsap.set(main, { 
            opacity: 1, 
            scale: 1
          });
        },

        leave({ current }) {
          // Mark as navigating when transition starts
          document.body.classList.add('barba-navigating');
          
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          return Promise.resolve();
        },

        async enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          newMain.__cleanup = initPageScripts(newMain);

          // Position containers exactly as original
          Object.assign(oldMain.style, { 
            position: 'absolute', 
            inset: '0', 
            zIndex: '1'
          });
          
          Object.assign(newMain.style, { 
            position: 'absolute', 
            inset: '0', 
            zIndex: '2',
            opacity: '0'
          });

          const gridDivs = transitionGrid.querySelectorAll('div');
          const C = Math.floor(5.5); // Matching the original centerColumn variable
          
          // Enable grid interaction
          document.body.style.cursor = 'none';
          transitionGrid.style.pointerEvents = 'all';

          // Create a promise-based animation sequence matching the original
          return new Promise((resolve) => {
            // PHASE 1: onEnter - Grid scales up from bottom
            gsap.to(gridDivs, {
              scaleY: 1,
              transformOrigin: '0% 100%',
              duration: 0.5,
              ease: 'o4',
              stagger: function(index) {
                // Exact stagger function from original
                const row = Math.floor(index / 11);
                const col = index % 11;
                return (9 - row + Math.abs(col - C)) * 0.05 + 0.3 * (Math.random() - 0.5);
              },
              onComplete: () => {
                // PHASE 2: onEntered - Swap content and grid scales down from top
                oldMain.style.opacity = '0';
                newMain.style.opacity = '1';
                
                gsap.to(gridDivs, {
                  scaleY: 0,
                  transformOrigin: '0% 0%',
                  duration: 0.5,
                  ease: 'o4',
                  stagger: function(index) {
                    // Exact stagger function from original
                    const row = Math.floor(index / 11);
                    const col = index % 11;
                    return (9 - row + Math.abs(col - C)) * 0.05 + 0.3 * (Math.random() - 0.5);
                  },
                  onComplete: () => {
                    // PHASE 3: onExited - Clean up
                    console.log('exited');
                    
                    // Reset styles
                    newMain.style.position = '';
                    newMain.style.inset = '';
                    newMain.style.zIndex = '';
                    newMain.style.opacity = '';
                    
                    if (oldMain && oldMain.parentNode) {
                      oldMain.remove();
                    }
                    
                    window.scrollTo(0, 0);
                    document.body.style.cursor = 'default';
                    transitionGrid.style.pointerEvents = 'none';
                    
                    // Remove navigation class when complete
                    document.body.classList.remove('barba-navigating');
                    
                    resolve();
                  }
                });
              }
            });
          });
        }
      }
    ]
  });
});