// transitions/grid-transition.js - Grid transition system
import { initPageScripts } from "../page-scripts.js";
import { calculateStaggerDelay } from "./stagger-calc.js";

export function createGridTransition(options = {}) {
  const { 
    cols = 20, 
    rows = 12,
    onNavReveal = () => {}
  } = options;
  
  // Register custom ease
  gsap.registerEase("o4", progress => 1 - Math.pow(1 - progress, 4));
  
  // Create grid overlay
  const { grid, divs } = createTransitionGrid(cols, rows);
  
  return {
    grid,
    divs,
    
    async leave({ container }) {
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      // Async cleanup
      if (container?.__cleanup) {
        requestAnimationFrame(() => {
          container.__cleanup();
          delete container.__cleanup;
        });
      }
    },
    
    async enter(current, next) {
      const oldMain = current.container;
      const newMain = next.container;
      
      // Initialize new page scripts
      newMain.__cleanup = initPageScripts(newMain);
      
      // Position containers
      setupContainers(oldMain, newMain);
      
      // Enable grid interaction
      document.body.style.cursor = 'none';
      grid.style.pointerEvents = 'all';
      
      // Force layout
      grid.offsetHeight;
      
      // Run animation sequence
      return animateTransition({
        oldMain,
        newMain,
        grid,
        divs,
        cols,
        rows,
        onNavReveal,
        onComplete: () => {
          cleanupTransition(oldMain, newMain, grid);
          onNavReveal(newMain);
        }
      });
    }
  };
}

function createTransitionGrid(cols, rows) {
  const grid = document.createElement('div');
  grid.className = 'transition-grid';
  grid.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(${cols}, 1fr);
    grid-template-rows: repeat(${rows}, 1fr);
    pointer-events: none;
    z-index: 10000;
    will-change: transform;
    contain: layout style paint;
  `;
  
  // Create grid cells
  const fragment = document.createDocumentFragment();
  const divs = [];
  
  for (let i = 0; i < cols * rows; i++) {
    const div = document.createElement('div');
    div.style.cssText = `
      width: calc(100% + 2px);
      height: calc(100% + 2px);
      margin-left: -1px;
      margin-top: -1px;
      transform: scaleY(0);
      transform-origin: 0% 100%;
      background: var(--swatch--brand-paper, #FDFCF3);
      will-change: transform;
      backface-visibility: hidden;
      contain: layout style paint;
    `;
    divs.push(div);
    fragment.appendChild(div);
  }
  
  grid.appendChild(fragment);
  document.body.appendChild(grid);
  
  return { grid, divs };
}

function setupContainers(oldMain, newMain) {
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
}

function animateTransition({ oldMain, newMain, grid, divs, cols, rows, onComplete }) {
  return new Promise(resolve => {
    // Phase 1: Grid scales up
    gsap.to(divs, {
      scaleY: 1,
      transformOrigin: '0% 100%',
      duration: 0.7,
      ease: 'o4',
      stagger: index => calculateStaggerDelay(index, cols, rows, false),
      onComplete: () => {
        // Phase 2: Swap content
        oldMain.style.opacity = '0';
        newMain.style.opacity = '1';
        
        // Force paint
        newMain.offsetHeight;
        
        // Phase 3: Grid scales down
        gsap.to(divs, {
          scaleY: 0,
          transformOrigin: '0% 0%',
          duration: 0.7,
          ease: 'o4',
          stagger: index => calculateStaggerDelay(index, cols, rows, true),
          onComplete: () => {
            console.log('exited');
            onComplete();
            resolve();
          }
        });
      }
    });
  });
}

function cleanupTransition(oldMain, newMain, grid) {
  // Reset new main styles
  newMain.style.position = '';
  newMain.style.inset = '';
  newMain.style.zIndex = '';
  newMain.style.opacity = '';
  
  // Remove old container
  if (oldMain?.parentNode) {
    oldMain.remove();
  }
  
  // Reset page state
  window.scrollTo(0, 0);
  document.body.style.cursor = 'default';
  grid.style.pointerEvents = 'none';
  document.body.classList.remove('barba-navigating');
}