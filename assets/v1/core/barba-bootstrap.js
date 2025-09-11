// barba-bootstrap.js - Grid transition adapted from Next.js

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  initGlobal();

  // Create the transition grid overlay once
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
    
    // Create 110 divs (11 columns x 10 rows)
    for (let i = 0; i < 110; i++) {
      const div = document.createElement('div');
      div.style.cssText = `
        width: calc(100% + 2px);
        height: calc(100% + 2px);
        margin-left: -1px;
        margin-top: -1px;
        transform: scaleY(0);
        transform-origin: 0% 100%;
        background: #79837a;
      `;
      grid.appendChild(div);
    }
    
    document.body.appendChild(grid);
    return grid;
  };

  // Initialize the grid but keep it hidden
  const transitionGrid = createTransitionGrid();

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
          if (current?.container?.__cleanup) {
            current.container.__cleanup();
            delete current.container.__cleanup;
          }
          
          // Start the grid animation entering
          document.body.style.cursor = 'wait';
          transitionGrid.style.pointerEvents = 'all';
          
          const gridDivs = transitionGrid.querySelectorAll('div');
          const centerColumn = Math.floor(5.5); // Center reference for stagger calculation
          
          return gsap.to(gridDivs, {
            scaleY: 1,
            transformOrigin: '0% 100%',
            duration: 0.5,
            ease: 'power4.out',
            stagger: {
              each: (index) => {
                // Calculate stagger based on distance from center, matching original logic
                const row = Math.floor(index / 11);
                const col = index % 11;
                const distanceFromCenter = Math.abs(col - centerColumn);
                const rowFactor = 9 - row;
                
                // Base stagger with some randomness
                return (rowFactor + distanceFromCenter) * 0.05 + 0.3 * (Math.random() - 0.5);
              }
            }
          });
        },

        enter({ current, next }) {
          const oldMain = current.container;
          const newMain = next.container;
          
          newMain.__cleanup = initPageScripts(newMain);

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
            opacity: '0' // Start hidden
          });

          const gridDivs = transitionGrid.querySelectorAll('div');
          const centerColumn = Math.floor(5.5);
          
          const tl = gsap.timeline({
            onComplete: () => {
              // Reset styles
              newMain.style.position = '';
              newMain.style.inset = '';
              newMain.style.zIndex = '';
              newMain.style.opacity = '';
              
              if (oldMain && oldMain.parentNode) {
                oldMain.remove();
              }
              
              // Reset cursor and pointer events
              document.body.style.cursor = 'default';
              transitionGrid.style.pointerEvents = 'none';
              
              window.scrollTo(0, 0);
            }
          });

          // At the peak of the transition, swap content visibility
          tl.set(oldMain, { opacity: 0 }, 0.4)
            .set(newMain, { opacity: 1 }, 0.4);

          // Animate grid out from top
          tl.to(gridDivs, {
            scaleY: 0,
            transformOrigin: '0% 0%',
            duration: 0.5,
            ease: 'power4.out',
            stagger: {
              each: (index) => {
                const row = Math.floor(index / 11);
                const col = index % 11;
                const distanceFromCenter = Math.abs(col - centerColumn);
                const rowFactor = 9 - row;
                
                return (rowFactor + distanceFromCenter) * 0.05 + 0.3 * (Math.random() - 0.5);
              }
            }
          }, 0.4);

          return tl;
        }
      }
    ]
  });

  // Alternative: Custom ease for the grid animation
  gsap.registerEase("gridEase", function(progress) {
    // Custom ease that matches the 'o4' ease feel from the original
    return 1 - Math.pow(1 - progress, 4);
  });
});