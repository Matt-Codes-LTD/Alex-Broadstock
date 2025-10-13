// assets/v1/core/transitions/page-transition.js
// FIXED: Panel now stays at 0% between leave and enter phases

export function createPageTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  // Store panel at module level so it persists between leave and enter
  let transitionPanel = null;
  
  function getOrCreatePanel() {
    // If panel already exists and is in DOM, return it
    if (transitionPanel && document.body.contains(transitionPanel)) {
      console.log("[Transition] Using existing panel");
      return transitionPanel;
    }
    
    console.log("[Transition] Creating new panel");
    
    // Create new panel
    transitionPanel = document.createElement('div');
    transitionPanel.className = 'page-transition-panel';
    
    // Initial styles - DON'T set transform here, let GSAP handle it
    Object.assign(transitionPanel.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--_theme---background, #000000)',
      zIndex: '99999',
      willChange: 'transform',
      pointerEvents: 'none',
      opacity: '0', // Start invisible, GSAP will make visible
      visibility: 'hidden' // Start hidden, GSAP will show
    });
    
    document.body.appendChild(transitionPanel);
    return transitionPanel;
  }
  
  return {
    // PHASE 1: Panel slides in to cover current page
    async leave({ current }) {
      console.log("[Transition] LEAVE PHASE: Starting panel slide in");
      
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      // Prevent animations on home hero
      const heroSection = current.container.querySelector('.home-hero_wrap');
      if (heroSection) {
        heroSection.dataset.navigating = "true";
      }
      
      // Mute any playing videos
      const videos = current.container.querySelectorAll('video');
      videos.forEach(video => {
        if (!video.paused) {
          video.muted = true;
          video.setAttribute('muted', '');
        }
      });
      
      // Get or create panel
      const panel = getOrCreatePanel();
      
      // Ensure current page stays visible while panel slides over it
      current.container.style.opacity = '1';
      current.container.style.visibility = 'visible';
      
      // ANIMATE: Panel slides from -100% to 0%
      if (window.gsap) {
        // Ensure panel starts off-screen
        gsap.set(panel, {
          xPercent: -100,
          opacity: 1,
          visibility: 'visible',
          pointerEvents: 'none'
        });
        
        // Slide to center and KEEP IT THERE
        await gsap.to(panel, {
          xPercent: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            console.log("[Transition] Panel is now at center (0%)");
            // CRITICAL: Lock panel at 0% with higher specificity
            gsap.set(panel, {
              xPercent: 0,
              x: 0,
              transform: 'translateX(0%)',
              opacity: 1,
              visibility: 'visible',
              pointerEvents: 'none'
            });
          }
        });
      } else {
        // Fallback without GSAP
        panel.style.transition = 'transform 0.6s ease-in-out';
        panel.style.transform = 'translateX(-100%)';
        panel.style.opacity = '1';
        panel.style.visibility = 'visible';
        panel.style.pointerEvents = 'none';
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transform = 'translateX(0%)';
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      console.log("[Transition] LEAVE COMPLETE: Panel locked at center (0%)");
    },
    
    // PHASE 2: Load new page behind panel, then slide panel out
    async enter({ current, next }) {
      console.log("[Transition] ENTER PHASE: Starting page setup behind panel");
      
      const oldContainer = current.container;
      const newContainer = next.container;
      
      // Get the existing panel (should still be at center from leave phase)
      const panel = transitionPanel;
      
      if (!panel || !document.body.contains(panel)) {
        console.error("[Transition] ERROR: Panel not found or not in DOM!");
        // Fallback: just show the new page
        newContainer.style.opacity = '1';
        newContainer.style.visibility = 'visible';
        if (oldContainer && oldContainer.parentNode) {
          oldContainer.remove();
        }
        document.body.classList.remove('barba-navigating');
        onNavReveal(newContainer);
        return;
      }
      
      console.log("[Transition] Panel found, ensuring it stays at center (0%)");
      
      // CRITICAL: Lock panel at 0% before doing anything else
      if (window.gsap) {
        gsap.set(panel, {
          xPercent: 0,
          x: 0,
          transform: 'translateX(0%)',
          opacity: 1,
          visibility: 'visible',
          pointerEvents: 'none',
          immediateRender: true
        });
      } else {
        panel.style.transform = 'translateX(0%)';
        panel.style.opacity = '1';
        panel.style.visibility = 'visible';
        panel.style.pointerEvents = 'none';
      }
      
      // Prepare new page (hide certain elements if it's home page)
      if (newContainer.dataset.barbaNamespace === "home") {
        const elementsToHide = newContainer.querySelectorAll([
          ".nav_wrap",
          ".brand_logo",
          ".nav_link",
          ".home-category_text",
          ".home_hero_text",
          ".home-category_ref_text:not([hidden])",
          ".home-awards_list"
        ].join(","));
        
        if (window.gsap) {
          gsap.set(elementsToHide, {
            opacity: 0,
            visibility: "visible"
          });
        } else {
          elementsToHide.forEach(el => {
            el.style.opacity = "0";
            el.style.visibility = "visible";
          });
        }
      }
      
      // Position new page BEHIND the panel
      newContainer.style.position = 'fixed';
      newContainer.style.inset = '0';
      newContainer.style.width = '100%';
      newContainer.style.height = '100%';
      newContainer.style.zIndex = '9998'; // Below panel (99999)
      newContainer.style.opacity = '1';
      newContainer.style.visibility = 'visible';
      
      // Hide and remove old page (it's behind the panel anyway)
      if (oldContainer) {
        oldContainer.style.display = 'none';
        if (oldContainer.parentNode) {
          oldContainer.remove();
        }
      }
      
      // Reset scroll position
      window.scrollTo(0, 0);
      
      // Wait for new page to fully render and scripts to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("[Transition] New page ready behind panel, sliding panel out to right");
      
      // ANIMATE: Panel slides from 0% to 100%
      if (window.gsap) {
        await gsap.to(panel, {
          xPercent: 100,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            console.log("[Transition] Panel has slid out to right (100%)");
            
            // Remove panel after animation
            if (panel && panel.parentNode) {
              panel.remove();
            }
            transitionPanel = null;
          }
        });
      } else {
        // Fallback without GSAP
        panel.style.transition = 'transform 0.6s ease-in-out';
        panel.style.transform = 'translateX(100%)';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Remove panel after animation
        if (panel && panel.parentNode) {
          panel.remove();
        }
        transitionPanel = null;
      }
      
      // Reset new container styles
      newContainer.style.position = '';
      newContainer.style.inset = '';
      newContainer.style.width = '';
      newContainer.style.height = '';
      newContainer.style.zIndex = '';
      
      // Clear navigation flags
      const heroSection = newContainer.querySelector('.home-hero_wrap');
      if (heroSection) {
        delete heroSection.dataset.navigating;
      }
      
      // Cleanup
      document.body.classList.remove('barba-navigating');
      
      // Run reveal animations for new page
      onNavReveal(newContainer);
      
      console.log("[Transition] COMPLETE: New page revealed!");
    }
  };
}