// barba-bootstrap.js - Aggressive fix for layout shift

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
          // IMMEDIATELY freeze everything before any animations can start
          document.body.classList.add('barba-navigating');
          
          // Stop all GSAP animations on home hero elements
          const homeHero = current.container.querySelector('.home-hero_wrap');
          if (homeHero) {
            homeHero.dataset.navigating = "true";
            
            // Kill all tweens on home hero elements
            gsap.killTweensOf('.home-hero_list');
            gsap.killTweensOf('.home-hero_item');
            gsap.killTweensOf('.home_hero_text');
            gsap.killTweensOf('.home-category_ref_text');
            
            // Force set all elements to their current state
            const lists = homeHero.querySelectorAll('.home-hero_list');
            lists.forEach(list => {
              const currentTransform = getComputedStyle(list).transform;
              const currentOpacity = getComputedStyle(list).opacity;
              
              // Lock current state
              list.style.transform = currentTransform === 'none' ? '' : currentTransform;
              list.style.opacity = currentOpacity;
              list.style.transition = 'none !important';
              list.style.willChange = 'auto';
            });
            
            // Disable all animations on the container
            homeHero.style.pointerEvents = 'none';
          }
          
          // Freeze the entire layout
          const container = current.container;
          const rect = container.getBoundingClientRect();
          container.style.width = rect.width + 'px';
          container.style.height = rect.height + 'px';
          container.style.overflow = 'hidden';
          container.style.position = 'relative';
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

          // Hide new container completely
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

          // Create a snapshot of the old content
          const snapshot = document.createElement('div');
          snapshot.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999;
            pointer-events: none;
          `;
          
          // Use html2canvas if available, otherwise just hide content immediately
          if (window.html2canvas) {
            try {
              const canvas = await html2canvas(oldMain, {
                backgroundColor: '#000',
                scale: 1,
                logging: false
              });
              snapshot.appendChild(canvas);
              document.body.appendChild(snapshot);
            } catch(e) {
              console.log('Screenshot failed, proceeding without snapshot');
            }
          }

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
              onStart: () => {
                // Hide old content immediately
                oldMain.style.opacity = '0';
                oldMain.style.visibility = 'hidden';
              },
              onComplete: () => {
                // Remove snapshot if it exists
                if (snapshot.parentNode) {
                  snapshot.remove();
                }
                
                // Show new container
                Object.assign(newMain.style, { 
                  opacity: '1',
                  visibility: 'visible'
                });
                
                // PHASE 2: Grid scales down from top
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
    },
    // Add click handler to freeze animations immediately
    preventRunning: true,
    onClick: (e) => {
      const link = e.currentTarget;
      
      // If it's a project link, immediately freeze animations
      if (link.closest('.home-hero_item')) {
        // Stop all animations immediately
        gsap.globalTimeline.clear();
        
        // Freeze all home hero elements
        const lists = document.querySelectorAll('.home-hero_list');
        lists.forEach(el => {
          const computed = getComputedStyle(el);
          el.style.cssText += `
            transform: ${computed.transform} !important;
            opacity: ${computed.opacity} !important;
            transition: none !important;
            animation: none !important;
          `;
        });
      }
    }
  });
});