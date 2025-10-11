// grid-transition.js - Fixed FOUC on home page return
import { calculateStaggerDelay, clearStaggerCache } from "./stagger-calc.js";

let globalGrid = null;
let globalDivs = [];

export function createGridTransition(options = {}) {
  const { 
    cols = 20, 
    rows = 12,
    onNavReveal = () => {}
  } = options;
  
  // Register custom ease only once
  if (!gsap.parseEase("o4")) {
    gsap.registerEase("o4", progress => 1 - Math.pow(1 - progress, 4));
  }
  
  // Reuse existing grid or create new one
  let grid = globalGrid;
  let divs = globalDivs;
  
  if (!grid) {
    const result = createTransitionGrid(cols, rows);
    grid = result.grid;
    divs = result.divs;
    globalGrid = grid;
    globalDivs = divs;
  }
  
  return {
    grid,
    divs,
    
    async leave({ container }) {
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      // Mark for navigation to prevent FLIP animations
      const heroSection = container.querySelector('.home-hero_wrap');
      if (heroSection) {
        heroSection.dataset.navigating = "true";
        console.log("[Transition] Set navigating flag on leave");
      }
      
      // IMMEDIATE MUTE: Find all videos in current page and mute them
      const allVideos = container.querySelectorAll('video');
      allVideos.forEach(video => {
        if (!video.paused) {
          video.muted = true;
          video.setAttribute("muted", "");
          console.log("[Transition] Muted video on page leave:", video.src);
        }
      });
      
      // Also check for videos in home hero stage
      const heroVideos = container.querySelectorAll('.home-hero_video video');
      heroVideos.forEach(video => {
        video.muted = true;
        video.setAttribute("muted", "");
      });
    },
    
    async enter(current, next, oldCleanup = null) {
      const oldMain = current.container;
      const newMain = next.container;
      
      // CRITICAL: Hide home content IMMEDIATELY before it becomes visible
      if (newMain.dataset.barbaNamespace === "home") {
        // First, use direct element queries for immediate effect
        const elementsToHide = newMain.querySelectorAll([
          ".nav_wrap",
          ".brand_logo",
          ".nav_link",
          ".home-category_text",
          ".home_hero_text",
          ".home-category_ref_text:not([hidden])",
          ".home-awards_list",
          ".home-awards_list > *"
        ].join(","));
        
        // Set via GSAP
        gsap.set(elementsToHide, {
          opacity: 0,
          visibility: "visible"
        });
        
        // ALSO set via inline styles as immediate backup
        newMain.querySelectorAll(".home_hero_text").forEach(el => {
          el.style.opacity = "0";
          el.style.visibility = "visible";
        });
        
        newMain.querySelectorAll(".home-category_ref_text:not([hidden])").forEach(el => {
          el.style.opacity = "0";
          el.style.visibility = "visible";
        });
        
        // Hide awards items
        const awardsItems = newMain.querySelectorAll(".home-awards_list > *");
        awardsItems.forEach(el => {
          el.style.opacity = "0";
        });
        
        // Ensure menu wrapper starts hidden
        const menuWrapper = newMain.querySelector(".home-hero_menu");
        if (menuWrapper) {
          menuWrapper.style.opacity = "1";
          menuWrapper.style.visibility = "visible";
        }
      }
      
      // Position containers
      setupContainers(oldMain, newMain);
      
      // Enable grid interaction
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
        oldCleanup,
        onNavReveal,
        onComplete: () => {
          cleanupTransition(oldMain, newMain, grid);
          onNavReveal(newMain);
          
          // Clear navigation flag with fallback timeout
          const heroSection = newMain.querySelector('.home-hero_wrap');
          if (heroSection) {
            delete heroSection.dataset.navigating;
            console.log("[Transition] Cleared navigating flag on enter complete");
            
            setTimeout(() => {
              if (heroSection.dataset.navigating) {
                delete heroSection.dataset.navigating;
                console.log("[Transition] Cleared stuck navigating flag via fallback");
              }
            }, 1000);
          }
        }
      });
    },
    
    cleanup: () => {
      if (globalGrid && globalGrid.parentNode) {
        globalGrid.remove();
      }
      globalGrid = null;
      globalDivs = [];
      clearStaggerCache();
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
    z-index: 9999;
  `;
  
  const divs = [];
  for (let i = 0; i < cols * rows; i++) {
    const div = document.createElement('div');
    div.style.cssText = `
      background: var(--swatch--brand-paper);
      transform: scaleY(0);
      transform-origin: 0% 100%;
      will-change: transform;
    `;
    grid.appendChild(div);
    divs.push(div);
  }
  
  document.body.appendChild(grid);
  return { grid, divs };
}

function setupContainers(oldMain, newMain) {
  // Old container - fade out (keep visible during grid animation)
  oldMain.style.position = 'fixed';
  oldMain.style.inset = '0';
  oldMain.style.zIndex = '1';
  oldMain.style.opacity = '1';
  
  // New container - ready but hidden
  newMain.style.position = 'fixed';
  newMain.style.inset = '0';
  newMain.style.zIndex = '0';
  newMain.style.opacity = '0';
  
  // Extra insurance for home page elements
  if (newMain.dataset.barbaNamespace === "home") {
    // Make absolutely sure project names are hidden
    newMain.querySelectorAll(".home_hero_text, .home-category_ref_text:not([hidden])").forEach(el => {
      el.style.opacity = "0";
    });
  }
}

function animateTransition({ oldMain, newMain, grid, divs, cols, rows, oldCleanup, onNavReveal, onComplete }) {
  return new Promise((resolve) => {
    let phase1Timeline = null;
    let phase2Timeline = null;
    
    // Phase 1: Grid covers screen (video stays visible behind grid)
    phase1Timeline = gsap.timeline({
      onComplete: () => {
        // Grid has now covered the screen - safe to cleanup old container
        console.log("[Transition] Grid covered screen, running cleanup");
        
        // NOW run the cleanup that was passed from barba-bootstrap
        if (oldCleanup) {
          try {
            oldCleanup();
            console.log("[Transition] Old container cleanup complete");
          } catch (err) {
            console.warn("[Transition] Cleanup error:", err);
          }
        }
        
        // Cleanup phase 1 timeline
        if (phase1Timeline) {
          phase1Timeline.kill();
          phase1Timeline = null;
        }
        
        // Swap container visibility
        oldMain.style.opacity = '0';
        newMain.style.zIndex = '2';
        newMain.style.opacity = '1';
        
        // Force paint
        newMain.offsetHeight;
        
        // One more check to ensure home elements are hidden
        if (newMain.dataset.barbaNamespace === "home") {
          newMain.querySelectorAll(".home_hero_text").forEach(el => {
            if (!el.style.opacity || el.style.opacity === "1") {
              el.style.opacity = "0";
            }
          });
        }
        
        // Phase 2: Grid scales down to reveal new page
        phase2Timeline = gsap.timeline({
          onComplete: () => {
            // Cleanup phase 2 timeline
            if (phase2Timeline) {
              phase2Timeline.kill();
              phase2Timeline = null;
            }
            
            // Reset grid cells for reuse
            divs.forEach(div => {
              gsap.set(div, { scaleY: 0 });
            });
            
            onComplete();
            resolve();
          }
        });
        
        phase2Timeline.to(divs, {
          scaleY: 0,
          transformOrigin: '0% 0%',
          duration: 0.7,
          ease: 'o4',
          stagger: index => calculateStaggerDelay(index, cols, rows, true)
        });
      }
    });
    
    phase1Timeline.to(divs, {
      scaleY: 1,
      transformOrigin: '0% 100%',
      duration: 0.7,
      ease: 'o4',
      stagger: index => calculateStaggerDelay(index, cols, rows, false)
    });
  });
}

function cleanupTransition(oldMain, newMain, grid) {
  // Reset new main styles
  newMain.style.position = '';
  newMain.style.inset = '';
  newMain.style.zIndex = '';
  newMain.style.opacity = '';
  
  // Remove old container safely
  if (oldMain?.parentNode) {
    try {
      oldMain.remove();
      console.log("[Transition] Old container removed from DOM");
    } catch (err) {
      console.warn("[Transition] Old container removal failed:", err);
    }
  }
  
  // Reset page state
  window.scrollTo(0, 0);
  grid.style.pointerEvents = 'none';
  document.body.classList.remove('barba-navigating');
}