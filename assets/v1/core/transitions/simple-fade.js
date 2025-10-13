// assets/v1/core/transitions/simple-fade.js
// Simple fade transition to replace complex grid animation

export function createSimpleFadeTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
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
      
      // Fade out current container
      if (window.gsap) {
        await gsap.to(current.container, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut"
        });
      } else {
        current.container.style.opacity = "0";
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    },
    
    async enter({ current, next }) {
      const oldMain = current.container;
      const newMain = next.container;
      
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
      newMain.style.opacity = '0';
      
      // Clean up old container
      if (oldMain?.parentNode) {
        oldMain.remove();
      }
      
      // Fade in new container
      if (window.gsap) {
        await gsap.to(newMain, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.inOut"
        });
      } else {
        newMain.style.opacity = "1";
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      // Reset container styles
      newMain.style.position = '';
      newMain.style.inset = '';
      newMain.style.zIndex = '';
      newMain.style.opacity = '';
      
      // Clear navigation flag
      const heroSection = newMain.querySelector('.home-hero_wrap');
      if (heroSection) {
        delete heroSection.dataset.navigating;
      }
      
      // Reset scroll and cleanup
      window.scrollTo(0, 0);
      document.body.classList.remove('barba-navigating');
      
      // Run nav reveal animations
      onNavReveal(newMain);
    }
  };
}