// barba-bootstrap.js - Targeted fix for layout shift while preserving animations

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

        beforeLeave({ current }) {
          // Mark as navigating to prevent FLIP animations
          document.body.classList.add('barba-navigating');
          
          const homeHero = current.container.querySelector('.home-hero_wrap');
          if (homeHero) {
            homeHero.dataset.navigating = "true";
            
            // Only kill FLIP animation tweens, not video crossfades
            gsap.killTweensOf('.home-hero_list');
            gsap.killTweensOf('.ghost-exit-layer *');
            
            // Lock the current layout state of lists
            const lists = homeHero.querySelectorAll('.home-hero_list');
            lists.forEach(list => {
              // Get current computed values
              const rect = list.getBoundingClientRect();
              const computed = getComputedStyle(list);
              
              // Only lock transform and display, not opacity
              if (computed.display !== 'none') {
                list.style.transform = 'none';
                list.style.willChange = 'auto';
              }
            });
            
            // Remove any ghost elements immediately
            const ghosts = document.querySelectorAll('.ghost-exit-layer');
            ghosts.forEach(g => g.remove());
          }
        },

        leave({ current }) {
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

          // Lock old container dimensions
          const oldMainRect = oldMain.getBoundingClientRect();
          oldMain.style.width = oldMainRect.width + 'px';
          oldMain.style.height = oldMainRect.height + 'px';
          oldMain.style.overflow = 'hidden';
          
          // Position containers
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
          const C = Math.floor(5.5); // Center column
          
          // Enable grid interaction
          document.body.style.cursor = 'none';
          transitionGrid.style.pointerEvents = 'all';

          return new Promise((resolve) => {
            // PHASE 1: Grid scales up from bottom
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
              onComplete: () => {
                // PHASE 2: Swap content and grid scales down
                oldMain.style.opacity = '0';
                newMain.style.opacity = '1';
                
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
                    console.log('exited');
                    
                    // Reset new container styles
                    newMain.style.position = '';
                    newMain.style.inset = '';
                    newMain.style.zIndex = '';
                    newMain.style.opacity = '';
                    
                    // Remove old container
                    if (oldMain && oldMain.parentNode) {
                      oldMain.remove();
                    }
                    
                    // Reset page state
                    window.scrollTo(0, 0);
                    document.body.style.cursor = 'default';
                    transitionGrid.style.pointerEvents = 'none';
                    
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
    // Add click handler to prevent FLIP animations immediately
    preventRunning: true,
    onClick: (e) => {
      const link = e.currentTarget;
      
      // If it's a project link, prevent FLIP animations
      if (link.closest('.home-hero_item')) {
        // Set navigation flag immediately
        const homeHero = document.querySelector('.home-hero_wrap');
        if (homeHero) {
          homeHero.dataset.navigating = "true";
        }
        
        // Kill only FLIP animations, not video animations
        gsap.killTweensOf('.home-hero_list');
        gsap.killTweensOf('.ghost-exit-layer *');
        
        // Remove any existing ghost elements
        document.querySelectorAll('.ghost-exit-layer').forEach(g => g.remove());
      }
    }
  });
});