// assets/v1/core/transitions/simple-wipe.js
// Single panel wipe transition - slides in from left, out to right

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
      
      // Animate panel sliding in from left to cover screen
      if (window.gsap) {
        await gsap.fromTo(panel, 
          {
            xPercent: -100 // Start off-screen left
          },
          {
            xPercent: 0, // Slide to center (covering screen)
            duration: 0.6,
            ease: "power2.inOut"
          }
        );
      } else {
        // CSS fallback
        panel.style.transition = 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)';
        panel.style.transform = 'translateX(-100%)';
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transform = 'translateX(0)';
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // Hide old container after wipe covers it
      current.container.style.opacity = '0';
    },
    
    async enter({ current, next }) {
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
      
      // Position containers
      oldMain.style.position = 'fixed';
      oldMain.style.inset = '0';
      oldMain.style.zIndex = '1';
      
      newMain.style.position = 'fixed';
      newMain.style.inset = '0';
      newMain.style.zIndex = '2';
      newMain.style.opacity = '1'; // New page is visible but covered by panel
      
      // Clean up old container
      if (oldMain?.parentNode) {
        oldMain.remove();
      }
      
      // Scroll to top before reveal
      window.scrollTo(0, 0);
      
      // Small delay to ensure new page is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Animate panel sliding out to the right
      if (window.gsap) {
        await gsap.to(panel, {
          xPercent: 100, // Slide out to the right
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            // Reset panel position for next use (back to left side)
            gsap.set(panel, {
              xPercent: -100 // Reset to off-screen left
            });
          }
        });
      } else {
        // CSS fallback
        panel.style.transition = 'transform 0.6s cubic-bezier(0.45, 0, 0.55, 1)';
        
        // Force reflow
        panel.offsetHeight;
        
        panel.style.transform = 'translateX(100%)';
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Reset for next use
        panel.style.transform = 'translateX(-100%)';
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
    }
  };
}