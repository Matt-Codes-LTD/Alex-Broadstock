// assets/v1/core/transitions/page-transition.js
// Panel slide transition: left to center, load page, center to right

export function createPageTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  // Create and manage the transition panel
  let panel = null;
  
  function createPanel() {
    if (panel) return panel;
    
    panel = document.createElement('div');
    panel.className = 'page-transition-panel';
    
    // Initial styles - start off-screen left
    Object.assign(panel.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100vh',
      backgroundColor: 'var(--_theme---background, #000000)',
      zIndex: '99999',
      transform: 'translateX(-100%)',
      willChange: 'transform',
      pointerEvents: 'none'
    });
    
    document.body.appendChild(panel);
    return panel;
  }
  
  function cleanupPanel() {
    if (panel && panel.parentNode) {
      panel.remove();
      panel = null;
    }
  }
  
  return {
    // PHASE 1: Panel slides in to cover current page
    async leave({ current }) {
      console.log("[Transition] Phase 1: Sliding panel in to cover current page");
      
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
      
      // Create or get panel
      const transitionPanel = createPanel();
      
      // Ensure current page stays visible while panel slides over it
      current.container.style.opacity = '1';
      current.container.style.visibility = 'visible';
      
      // ANIMATE: Panel slides from -100% to 0%
      if (window.gsap) {
        // Set initial position
        gsap.set(transitionPanel, {
          xPercent: -100
        });
        
        // Slide to center
        await gsap.to(transitionPanel, {
          xPercent: 0,
          duration: 0.6,
          ease: "power2.inOut"
        });
      } else {
        // Fallback without GSAP
        transitionPanel.style.transition = 'transform 0.6s ease-in-out';
        transitionPanel.style.transform = 'translateX(-100%)';
        
        // Force reflow
        transitionPanel.offsetHeight;
        
        transitionPanel.style.transform = 'translateX(0%)';
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      console.log("[Transition] Panel now covers screen, ready for page load");
    },
    
    // PHASE 2: Load new page behind panel, then slide panel out
    async enter({ current, next }) {
      console.log("[Transition] Phase 2: Loading new page behind panel");
      
      const oldContainer = current.container;
      const newContainer = next.container;
      const transitionPanel = panel; // Use existing panel from leave phase
      
      if (!transitionPanel) {
        console.error("[Transition] Panel not found!");
        return;
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
      
      // Small delay to ensure new page is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log("[Transition] New page loaded, sliding panel out");
      
      // ANIMATE: Panel slides from 0% to 100%
      if (window.gsap) {
        await gsap.to(transitionPanel, {
          xPercent: 100,
          duration: 0.6,
          ease: "power2.inOut"
        });
      } else {
        // Fallback without GSAP
        transitionPanel.style.transition = 'transform 0.6s ease-in-out';
        transitionPanel.style.transform = 'translateX(100%)';
        await new Promise(resolve => setTimeout(resolve, 600));
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
      cleanupPanel();
      
      // Run reveal animations for new page
      onNavReveal(newContainer);
      
      console.log("[Transition] Complete!");
    }
  };
}