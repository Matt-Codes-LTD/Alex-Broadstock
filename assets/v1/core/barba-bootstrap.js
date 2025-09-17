// barba-bootstrap.js - Finer grid transition (20x12 = 240 cells)

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  // Track if this is the initial page load
  window.__initialPageLoad = true;

  initGlobal();

  // Create the transition grid overlay - finer grid for smoother effect
  const createTransitionGrid = () => {
    const COLS = 20; // More columns for finer control
    const ROWS = 12; // More rows for smoother vertical transition
    
    const grid = document.createElement('div');
    grid.className = 'transition-grid';
    grid.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(${COLS}, 1fr);
      grid-template-rows: repeat(${ROWS}, 1fr);
      pointer-events: none;
      z-index: 10000;
    `;
    
    // Create 240 divs for finer transition control
    for (let i = 0; i < COLS * ROWS; i++) {
      const div = document.createElement('div');
      div.style.cssText = `
        width: calc(100% + 2px);
        height: calc(100% + 2px);
        margin-left: -1px;
        margin-top: -1px;
        transform: scaleY(0);
        transform-origin: 0% 100%;
        background: var(--swatch--brand-ink, #FDFCF3);
      `;
      grid.appendChild(div);
    }
    
    document.body.appendChild(grid);
    return { grid, cols: COLS, rows: ROWS };
  };

  // Initialize the grid but keep it hidden
  const { grid: transitionGrid, cols: GRID_COLS, rows: GRID_ROWS } = createTransitionGrid();

  // Register custom ease that matches 'o4' from the original
  gsap.registerEase("o4", function(progress) {
    return 1 - Math.pow(1 - progress, 4);
  });

  // Nav animation function for project pages
  function animateProjectNav(container) {
    // Only animate on project pages
    if (container.dataset.barbaNamespace !== "project") return;
    
    // Set initial visible states (CSS handles opacity: 0)
    gsap.set([
      ".nav_wrap",
      ".nav_link",
      ".project_name",
      ".project-player_center-toggle",
      ".project-player_controls"
    ], {
      visibility: "visible"
    });
    
    const tl = gsap.timeline();
    
    // Nav wrapper foundation
    tl.fromTo(".nav_wrap", {
      opacity: 0,
      y: -20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    
    // Back link + other nav links
    .fromTo(".nav_link", {
      opacity: 0,
      x: 20
    }, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.4")
    
    // Project name - slide from left like project titles
    .fromTo(".project_name", {
      opacity: 0,
      x: -30,
      filter: "blur(4px)"
    }, {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      duration: 0.5,
      ease: "power2.out"
    }, "-=0.3")
    
    // Bottom controls container
    .fromTo(".project-player_controls", {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out"
    }, "-=0.4")
    
    // Play button and timeline (subtle fade)
    .fromTo([".project-player_btn--play", ".project-player_timeline"], {
      opacity: 0
    }, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.3")
    
    // Sound and Fullscreen text - stagger up from bottom
    .fromTo([".project-player_btn--mute", ".project-player_btn--fs"], {
      opacity: 0,
      y: 15
    }, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.3")
    
    // Center sound/play button - scale up with bounce
    .fromTo(".project-player_center-toggle", {
      opacity: 0,
      scale: 0.85
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)"
    }, "-=0.4");
    
    return tl;
  }

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
          
          // Animate nav on initial page load if it's a project page
          animateProjectNav(main);
          
          // Clear the initial load flag after the first page is loaded
          setTimeout(() => {
            window.__initialPageLoad = false;
          }, 100);
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
          const CENTER_COL = Math.floor(GRID_COLS / 2); // Center column for radial effect
          const CENTER_ROW = Math.floor(GRID_ROWS / 2); // Center row for radial effect
          
          // Enable grid interaction
          document.body.style.cursor = 'none';
          transitionGrid.style.pointerEvents = 'all';

          // Create a promise-based animation sequence matching the original
          return new Promise((resolve) => {
            // PHASE 1: onEnter - Grid scales up from bottom
            gsap.to(gridDivs, {
              scaleY: 1,
              transformOrigin: '0% 100%',
              duration: 0.8,  // Increased from 0.5
              ease: 'o4',
              stagger: function(index) {
                // More sophisticated stagger with finer grid
                const row = Math.floor(index / GRID_COLS);
                const col = index % GRID_COLS;
                
                // Calculate distance from center for radial effect
                const distFromCenter = Math.sqrt(
                  Math.pow(col - CENTER_COL, 2) + 
                  Math.pow(row - CENTER_ROW, 2)
                );
                
                // Base delay on distance from center + some randomness
                return (distFromCenter * 0.03) + 0.15 * (Math.random() - 0.5);  // Increased stagger
              },
              onComplete: () => {
                // PHASE 2: onEntered - Swap content and grid scales down from top
                oldMain.style.opacity = '0';
                newMain.style.opacity = '1';
                
                gsap.to(gridDivs, {
                  scaleY: 0,
                  transformOrigin: '0% 0%',
                  duration: 0.8,  // Increased from 0.5
                  ease: 'o4',
                  stagger: function(index) {
                    // Similar stagger for exit
                    const row = Math.floor(index / GRID_COLS);
                    const col = index % GRID_COLS;
                    
                    const distFromCenter = Math.sqrt(
                      Math.pow(col - CENTER_COL, 2) + 
                      Math.pow(row - CENTER_ROW, 2)
                    );
                    
                    return (distFromCenter * 0.03) + 0.15 * (Math.random() - 0.5);  // Increased stagger
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
                    
                    // Animate nav for project pages
                    animateProjectNav(newMain);
                    
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