// barba-bootstrap.js - Fixed layout shift during transitions

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  // Create the transition grid overlay
  const createTransitionGrid = () => {
    const grid = document.createElement('div');
    grid.className = 'transition-grid';
    grid.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(11, 1fr);
      pointer-events: none;
      z-index: 1000;
    `;
    
    // Create exactly 110 divs
    for (let i = 0; i < 110; i++) {
      const div = document.createElement('div');
      div.style.cssText = `
        width: calc(100% + 2px);
        height: calc(100% + 2px);
        margin-left: -1px;
        margin-top: -1px;
        transform: scaleY(0);
        transform-origin: 0% 100%;
        background: #000;
      `;
      grid.appendChild(div);
    }
    
    document.body.appendChild(grid);
    return grid;
  };

  // Initialize the grid but keep it hidden
  const transitionGrid = createTransitionGrid();

  // Register custom ease
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
          
          // Add dataset flag for home-hero section
          const homeHero = current.container.querySelector('.home-hero_wrap');
          if (homeHero) {
            homeHero.dataset.navigating = "true";
          }
          
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

          // Capture current dimensions and scroll position before any changes
          const oldMainRect = oldMain.getBoundingClientRect();
          const scrollY = window.scrollY;
          
          // Keep old container in document flow initially
          oldMain.style.minHeight = oldMainRect.height + 'px';
          
          // Prepare new container but keep it hidden
          Object.assign(newMain.style, { 
            position: 'absolute', 
            inset: '0', 
            zIndex: '2',
            opacity: '0',
            visibility: 'hidden'
          });

          const gridDivs = transitionGrid.querySelectorAll('div');
          const C = Math.floor(5.5); // Center column
          
          // Enable grid interaction
          document.body.style.cursor = 'none';
          transitionGrid.style.pointerEvents = 'all';
          transitionGrid.style.zIndex = '1000';

          return new Promise((resolve) => {
            // PHASE 1: Grid scales up from bottom (covering the old content)
            gsap.to(gridDivs, {
              scaleY: 1,
              transformOrigin: '0% 100%',
              duration: 0.5,
              ease: 'o4',
              stagger: function(index) {
                const row = Math.floor(index / 11);
                const col = index % 11;
                return (9 - row + Math.abs(col - C)) * 0.05 + 0.3 * (Math.random() - 0.5);
              },
              onStart: () => {
                // Lock the old container dimensions to prevent layout shift
                Object.assign(oldMain.style, {
                  width: oldMainRect.width + 'px',
                  height: oldMainRect.height + 'px',
                  overflow: 'hidden'
                });
              },
              onComplete: () => {
                // Now that grid covers everything, we can safely manipulate containers
                Object.assign(oldMain.style, { 
                  position: 'absolute', 
                  inset: '0', 
                  zIndex: '1',
                  opacity: '0',
                  visibility: 'hidden'
                });
                
                // Show new container
                Object.assign(newMain.style, { 
                  opacity: '1',
                  visibility: 'visible'
                });
                
                // PHASE 2: Grid scales down from top (revealing new content)
                gsap.to(gridDivs, {
                  scaleY: 0,
                  transformOrigin: '0% 0%',
                  duration: 0.5,
                  ease: 'o4',
                  stagger: function(index) {
                    const row = Math.floor(index / 11);
                    const col = index % 11;
                    return (9 - row + Math.abs(col - C)) * 0.05 + 0.3 * (Math.random() - 0.5);
                  },
                  onComplete: () => {
                    // PHASE 3: Clean up
                    console.log('exited');
                    
                    // Reset new container styles
                    newMain.style.position = '';
                    newMain.style.inset = '';
                    newMain.style.zIndex = '';
                    newMain.style.opacity = '';
                    newMain.style.visibility = '';
                    
                    // Remove old container
                    if (oldMain && oldMain.parentNode) {
                      oldMain.remove();
                    }
                    
                    // Reset page state
                    window.scrollTo(0, 0);
                    document.body.style.cursor = 'default';
                    transitionGrid.style.pointerEvents = 'none';
                    transitionGrid.style.zIndex = '1000';
                    
                    // Remove navigation class
                    document.body.classList.remove('barba-navigating');
                    
                    resolve();
                  }
                });
              }
            });
          });
        }
      }
    ],
    // Prevent Barba from animating on certain links
    prevent: ({ el }) => {
      // Prevent on links with target="_blank" or specific classes
      return el.classList && el.classList.contains('no-barba');
    }
  });
});