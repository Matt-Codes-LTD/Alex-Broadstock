// barba-bootstrap.js - Optimized transition grid

import { initPageScripts, initGlobal } from "./page-scripts.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("[Barba] init starting…");

  // Track if this is the initial page load
  window.__initialPageLoad = true;

  initGlobal();

  // Create the transition grid overlay with optimizations
  const createTransitionGrid = () => {
    const COLS = 20;
    const ROWS = 12;
    
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
      will-change: transform;
      contain: layout style paint;
    `;
    
    // Pre-create fragment for better performance
    const fragment = document.createDocumentFragment();
    const divs = [];
    
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
        will-change: transform;
        backface-visibility: hidden;
        contain: layout style paint;
      `;
      divs.push(div);
      fragment.appendChild(div);
    }
    
    grid.appendChild(fragment);
    document.body.appendChild(grid);
    
    return { grid, cols: COLS, rows: ROWS, divs };
  };

  // Initialize the grid but keep it hidden
  const { grid: transitionGrid, cols: GRID_COLS, rows: GRID_ROWS, divs: gridDivs } = createTransitionGrid();

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

  // Pre-calculate stagger delays for consistent performance
  const staggerCache = new Map();
  function getStaggerDelay(index, cols, rows) {
    if (staggerCache.has(index)) return staggerCache.get(index);
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);
    
    const distFromCenter = Math.sqrt(
      Math.pow(col - centerCol, 2) + 
      Math.pow(row - centerRow, 2)
    );
    
    // Deterministic stagger without random
    const delay = (distFromCenter * 0.025) + (index * 0.0005);
    staggerCache.set(index, delay);
    return delay;
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

        async leave({ current }) {
          // Mark as navigating when transition starts
          document.body.classList.add('barba-navigating');
          
          // Async cleanup to avoid blocking
          if (current?.container?.__cleanup) {
            requestAnimationFrame(() => {
              current.container.__cleanup();
              delete current.container.__cleanup;
            });
          }
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

          // Enable grid interaction
          document.body.style.cursor = 'none';
          transitionGrid.style.pointerEvents = 'all';
          
          // Force layout before animation
          transitionGrid.offsetHeight;

          // Create a promise-based animation sequence
          return new Promise((resolve) => {
            // PHASE 1: Grid scales up
            gsap.to(gridDivs, {
              scaleY: 1,
              transformOrigin: '0% 100%',
              duration: 0.7,
              ease: 'o4',
              stagger: function(index) {
                return getStaggerDelay(index, GRID_COLS, GRID_ROWS);
              },
              onComplete: () => {
                // PHASE 2: Swap content instantly
                oldMain.style.opacity = '0';
                newMain.style.opacity = '1';
                
                // Force paint to ensure opacity change is applied
                newMain.offsetHeight;
                
                // PHASE 3: Grid scales down
                gsap.to(gridDivs, {
                  scaleY: 0,
                  transformOrigin: '0% 0%',
                  duration: 0.7,
                  ease: 'o4',
                  stagger: function(index) {
                    return getStaggerDelay(index, GRID_COLS, GRID_ROWS);
                  },
                  onComplete: () => {
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
                    
                    // Remove navigation class
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
    ],
    // Prefetch on hover for smoother transitions
    prefetch: true,
    cacheIgnore: false
  });
});