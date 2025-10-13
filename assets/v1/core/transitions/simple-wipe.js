// assets/v1/core/transitions/simple-wipe.js
// Single panel wipe transition - slides in over current page, then reveals new page

export function createSimpleWipeTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  // Create wipe panel once and reuse
  let wipePanel = null;
  
  function getWipePanel() {
    if (!wipePanel) {
      wipePanel = document.createElement('div');
      wipePanel.className = 'barba-wipe-panel';
      
      // Set initial styles - start off-screen to the left
      Object.assign(wipePanel.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100vh',
        backgroundColor: 'var(--_theme---background, #000)',
        zIndex: '99999',
        transform: 'translateX(-100%)', // Start off-screen left
        pointerEvents: 'none',
        willChange: 'transform'
      });
      
      document.body.appendChild(wipePanel);
    }
    return wipePanel;
  }
  
  return {
    async leave({ current }) {
      console.log("[Wipe] Starting leave phase - sliding panel over current page");
      
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      // Mark hero section to prevent FLIP animations
      const heroSection = current.container.querySelector('.home-hero_wrap');
      if (heroSection) {
        heroSection.dataset.navigating = "true";
      }
      
      // Mute all videos
      const allVideos = current.container.querySelectorAll('video');
      allVideos.forEach(video => {
        if (!video.paused) {
          video.muted = true;
          video.setAttribute("muted", "");
        }
      });
      
      // Get or create wipe panel
      const panel = getWipePanel();
      
      // IMPORTANT: Keep current page visible during the wipe
      current.container.style.opacity = '1';
      current.container.style.visibility = 'visible';
      
      // Animate panel sliding in from left to cover screen
      if (window.gsap) {
        // Ensure panel starts off-screen
        gsap.set(panel, {
          xPercent: -100
        });
        
        // Slide in to cover screen (over the visible current page)
        await gsap.to(panel, {
          xPercent: 0, // Slide to center (covering screen)
          duration: 0.6,
          ease: "power2.inOut"
        });
        
        // NOW that panel fully covers, we can hide the current page
        current.container.style.opacity = '0';
        current.container.style.visibility = 'hidden';
        
      } else {
        // CSS fallback
        panel.style.transition = 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)';
        panel.style.transform = 'translateX(-100%)';
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transform = 'translateX(0)';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Hide current page after animation
        current.container.style.opacity = '0';
        current.container.style.visibility = 'hidden';
      }
      
      console.log("[Wipe] Leave complete - panel now covering screen, old page hidden");
    },
    
    async enter({ current, next }) {
      console.log("[Wipe] Starting enter phase - setting up new page behind panel");
      
      const oldMain = current.container;
      const newMain = next.container;
      const panel = getWipePanel();
      
      // Hide home content immediately if navigating to home
      if (newMain.dataset.barbaNamespace === "home") {
        const elementsToHide = newMain.querySelectorAll([
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
      
      // Position new container BEHIND the panel
      newMain.style.position = 'fixed';
      newMain.style.inset = '0';
      newMain.style.zIndex = '9998'; // Below panel (99999) but above everything else
      newMain.style.opacity = '1';
      newMain.style.visibility = 'visible';
      
      // Position old container below new one
      if (oldMain) {
        oldMain.style.zIndex = '1';
      }
      
      // Scroll to top
      window.scrollTo(0, 0);
      
      // Small pause to ensure new page is fully rendered behind panel
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clean up old container (it's already hidden behind panel)
      if (oldMain?.parentNode) {
        oldMain.remove();
      }
      
      console.log("[Wipe] New page ready behind panel - sliding panel out");
      
      // Animate panel sliding out to the right to reveal new page
      if (window.gsap) {
        // Panel should be at xPercent: 0 from leave phase
        await gsap.to(panel, {
          xPercent: 100, // Slide out to the right
          duration: 0.6,
          ease: "power2.inOut"
        });
        
        // After animation completes, reset panel for next use
        gsap.set(panel, {
          xPercent: -100 // Reset to off-screen left for next transition
        });
        
      } else {
        // CSS fallback
        panel.style.transition = 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)';
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transform = 'translateX(100%)';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Reset for next use
        setTimeout(() => {
          panel.style.transform = 'translateX(-100%)';
        }, 100);
      }
      
      // Reset container styles
      newMain.style.position = '';
      newMain.style.inset = '';
      newMain.style.zIndex = '';
      
      // Clear navigation flag
      const heroSection = newMain.querySelector('.home-hero_wrap');
      if (heroSection) {
        delete heroSection.dataset.navigating;
      }
      
      // Cleanup
      document.body.classList.remove('barba-navigating');
      
      // Run nav reveal animations
      onNavReveal(newMain);
      
      console.log("[Wipe] Transition complete - new page revealed");
    }
  };
}