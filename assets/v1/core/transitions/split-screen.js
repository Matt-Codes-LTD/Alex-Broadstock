// assets/v1/core/transitions/split-screen.js - CURTAIN REVEAL VERSION
import { ANIMATION } from "../animation-constants.js";

export function createSplitScreenTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  // Store panels at module level - they persist between phases
  let leftPanel = null;
  let rightPanel = null;
  let isForward = false;
  let isBackward = false;
  
  return {
    async leave({ current, trigger }) {
      console.log("[SplitScreen] Curtains closing...");
      
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      const heroSection = current.container.querySelector('.home-hero_wrap');
      if (heroSection) {
        heroSection.dataset.navigating = "true";
      }
      
      // Mute videos
      const allVideos = current.container.querySelectorAll('video');
      allVideos.forEach(video => {
        if (!video.paused) {
          video.muted = true;
          video.setAttribute("muted", "");
        }
      });
      
      // DETECT NAVIGATION DIRECTION
      const currentNamespace = current.container.dataset.barbaNamespace;
      let nextNamespace = 'home';
      
      if (trigger && trigger.href) {
        if (trigger.href.includes('/work/') || trigger.href.includes('/project/')) {
          nextNamespace = 'project';
        } else if (trigger.href === '/' || trigger.href.endsWith('.com/') || trigger.href.endsWith('.com')) {
          nextNamespace = 'home';
        }
      }
      
      isForward = currentNamespace === 'home' && nextNamespace === 'project';
      isBackward = currentNamespace === 'project' && nextNamespace === 'home';
      
      console.log(`[SplitScreen] Direction: ${isForward ? 'forward' : isBackward ? 'backward' : 'lateral'}`);
      
      // CREATE CURTAIN PANELS
      leftPanel = document.createElement('div');
      rightPanel = document.createElement('div');
      
      leftPanel.className = 'transition-panel transition-panel--left';
      rightPanel.className = 'transition-panel transition-panel--right';
      
      // Style panels
      [leftPanel, rightPanel].forEach((panel, i) => {
        Object.assign(panel.style, {
          position: 'fixed',
          top: '0',
          width: '50%',
          height: '100%',
          backgroundColor: 'var(--_theme---background)',
          zIndex: '9999',
          transformOrigin: i === 0 ? 'left center' : 'right center',
          willChange: 'transform',
          overflow: 'hidden',
          [i === 0 ? 'left' : 'right']: '0'
        });
        document.body.appendChild(panel);
      });
      
      // ADD BRAND ELEMENT
      const brandMark = document.createElement('div');
      brandMark.className = 'transition-panel__brand';
      brandMark.innerHTML = 'AB';
      
      Object.assign(brandMark.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '4rem',
        fontWeight: 'var(--_typography---font--primary-medium)',
        color: 'var(--_theme---text)',
        opacity: '0.1',
        letterSpacing: '0.1em',
        pointerEvents: 'none',
        userSelect: 'none'
      });
      
      leftPanel.appendChild(brandMark.cloneNode(true));
      rightPanel.appendChild(brandMark.cloneNode(true));
      
      const leftBrand = leftPanel.querySelector('.transition-panel__brand');
      const rightBrand = rightPanel.querySelector('.transition-panel__brand');
      
      // ANIMATE CURTAINS CLOSING
      const tl = gsap.timeline();
      
      // Start fading out current page
      tl.to(current.container, {
        opacity: 0,
        filter: 'blur(10px)',
        scale: 0.95,
        duration: 0.5,
        ease: "power2.in"
      }, 0);
      
      // Curtains close inward
      tl.fromTo(leftPanel, {
        scaleX: 0
      }, {
        scaleX: 1,
        duration: 0.5,
        ease: "power3.inOut"
      }, 0);
      
      tl.fromTo(rightPanel, {
        scaleX: 0
      }, {
        scaleX: 1,
        duration: 0.5,
        ease: "power3.inOut"
      }, 0.08); // Slight stagger
      
      // Animate brand appearing
      tl.fromTo([leftBrand, rightBrand], {
        opacity: 0,
        scale: 0.8
      }, {
        opacity: 0.1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }, 0.2);
      
      await tl;
      
      console.log("[SplitScreen] Curtains closed - ready for page load");
      // CURTAINS NOW STAY CLOSED WHILE PAGE LOADS
    },
    
    async enter({ current, next }) {
      console.log("[SplitScreen] Loading page behind curtains...");
      
      if (!leftPanel || !rightPanel) {
        console.error("[SplitScreen] Panels not found!");
        return;
      }
      
      const oldMain = current.container;
      const newMain = next.container;
      
      // PREPARE NEW PAGE BEHIND CURTAINS
      // Hide home content if navigating to home
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
        
        gsap.set(elementsToHide, {
          opacity: 0,
          visibility: "visible"
        });
      }
      
      // Position new container behind curtains
      newMain.style.position = 'fixed';
      newMain.style.inset = '0';
      newMain.style.zIndex = '2'; // Behind panels (9999)
      
      // Set initial state
      gsap.set(newMain, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)'
      });
      
      // Remove old container
      if (oldMain?.parentNode) {
        oldMain.remove();
      }
      
      // Small pause to ensure content is ready
      await gsap.delayedCall(0.2);
      
      console.log("[SplitScreen] Page loaded - opening curtains...");
      
      // GET BRAND ELEMENTS FOR ANIMATION
      const leftBrand = leftPanel.querySelector('.transition-panel__brand');
      const rightBrand = rightPanel.querySelector('.transition-panel__brand');
      
      // ANIMATE CURTAINS OPENING
      const exitTl = gsap.timeline();
      
      // Fade out brand marks first
      exitTl.to([leftBrand, rightBrand], {
        opacity: 0,
        scale: 1.2,
        duration: 0.3,
        ease: "power2.in"
      }, 0);
      
      // Then open curtains
      if (isForward) {
        // Split apart horizontally
        exitTl.to(leftPanel, {
          xPercent: -100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.2);
        
        exitTl.to(rightPanel, {
          xPercent: 100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.28); // Slight stagger
        
      } else if (isBackward) {
        // Scale back to edges
        exitTl.to(leftPanel, {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: 0.6,
          ease: "power3.inOut"
        }, 0.2);
        
        exitTl.to(rightPanel, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.6,
          ease: "power3.inOut"
        }, 0.28);
        
      } else {
        // Lateral: slide vertically
        exitTl.to(leftPanel, {
          yPercent: -100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.2);
        
        exitTl.to(rightPanel, {
          yPercent: 100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.28);
      }
      
      await exitTl;
      
      // CLEANUP
      leftPanel.remove();
      rightPanel.remove();
      leftPanel = null;
      rightPanel = null;
      
      // Reset container styles
      newMain.style.position = '';
      newMain.style.inset = '';
      newMain.style.zIndex = '';
      
      // Clear navigation flags
      const heroSection = newMain.querySelector('.home-hero_wrap');
      if (heroSection) {
        delete heroSection.dataset.navigating;
      }
      
      window.scrollTo(0, 0);
      document.body.classList.remove('barba-navigating');
      
      // Run reveal animations for the new page content
      onNavReveal(newMain);
      
      console.log("[SplitScreen] Curtains opened - transition complete");
    }
  };
}