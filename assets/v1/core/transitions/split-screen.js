// assets/v1/core/transitions/split-screen.js - FIXED VERSION
import { ANIMATION } from "../animation-constants.js";

export function createSplitScreenTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  // Store panels at module level to share between phases
  let panels = null;
  
  return {
    async leave({ current, trigger }) {
      console.log("[SplitScreen] Leave phase starting");
      
      // Mark as navigating
      document.body.classList.add('barba-navigating');
      
      const heroSection = current.container.querySelector('.home-hero_wrap');
      if (heroSection) {
        heroSection.dataset.navigating = "true";
      }
      
      // Mute videos before transition
      const allVideos = current.container.querySelectorAll('video');
      allVideos.forEach(video => {
        if (!video.paused) {
          video.muted = true;
          video.setAttribute("muted", "");
        }
      });
      
      // DETECT NAVIGATION DIRECTION FROM TRIGGER
      const currentNamespace = current.container.dataset.barbaNamespace;
      let nextNamespace = 'home'; // default
      
      // Try to determine next namespace from the clicked link
      if (trigger && trigger.href) {
        if (trigger.href.includes('/work/') || trigger.href.includes('/project/')) {
          nextNamespace = 'project';
        } else if (trigger.href === '/' || trigger.href.endsWith('.com/') || trigger.href.endsWith('.com') || trigger.href.includes('/#')) {
          nextNamespace = 'home';
        }
      }
      
      // Determine direction
      const isForward = currentNamespace === 'home' && nextNamespace === 'project';
      const isBackward = currentNamespace === 'project' && nextNamespace === 'home';
      
      console.log(`[SplitScreen] Current: ${currentNamespace}, Next: ${nextNamespace}`);
      console.log(`[SplitScreen] Direction: ${isForward ? 'forward' : isBackward ? 'backward' : 'lateral'}`);
      
      // Create split panels
      const leftPanel = document.createElement('div');
      const rightPanel = document.createElement('div');
      
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
      
      // Store panels for enter phase
      panels = { leftPanel, rightPanel, isForward, isBackward };
      
      // Animate panels in
      const tl = gsap.timeline();
      
      // Fade current content
      tl.to(current.container, {
        opacity: 0.3,
        filter: 'blur(8px)',
        scale: isForward ? 0.95 : 1.05,
        duration: 0.5,
        ease: "power2.in"
      }, 0);
      
      // Animate panels based on direction
      if (isForward || !isBackward) {
        // Close inward for forward or lateral
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
        }, 0.08);
      } else {
        // Slide in from outside for backward
        tl.fromTo(leftPanel, {
          xPercent: -100
        }, {
          xPercent: 0,
          duration: 0.5,
          ease: "power3.out"
        }, 0);
        
        tl.fromTo(rightPanel, {
          xPercent: 100
        }, {
          xPercent: 0,
          duration: 0.5,
          ease: "power3.out"
        }, 0.08);
      }
      
      await tl;
      
      console.log("[SplitScreen] Leave phase complete");
    },
    
    async enter({ current, next }) {
      console.log("[SplitScreen] Enter phase starting");
      
      if (!panels) {
        console.error("[SplitScreen] No panels found!");
        return;
      }
      
      const { leftPanel, rightPanel, isForward, isBackward } = panels;
      const oldMain = current.container;
      const newMain = next.container;
      
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
      
      // Position containers
      oldMain.style.position = 'fixed';
      oldMain.style.inset = '0';
      oldMain.style.zIndex = '1';
      
      newMain.style.position = 'fixed';
      newMain.style.inset = '0';
      newMain.style.zIndex = '2';
      
      // Prepare new content
      gsap.set(newMain, {
        opacity: 0,
        scale: isForward ? 1.05 : isBackward ? 0.95 : 1,
        filter: 'blur(8px)'
      });
      
      // Remove old container
      if (oldMain?.parentNode) {
        oldMain.remove();
      }
      
      // Reveal new content
      await gsap.to(newMain, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: "power2.out"
      });
      
      // Small pause
      await gsap.delayedCall(0.1);
      
      // Animate panels out
      const exitTl = gsap.timeline();
      
      if (isForward || !isBackward) {
        // Split apart for forward/lateral
        exitTl.to(leftPanel, {
          xPercent: -100,
          duration: 0.6,
          ease: "power3.in"
        }, 0);
        
        exitTl.to(rightPanel, {
          xPercent: 100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.08);
      } else {
        // Scale back to center for backward
        exitTl.to(leftPanel, {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: 0.6,
          ease: "power3.inOut"
        }, 0);
        
        exitTl.to(rightPanel, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 0.6,
          ease: "power3.inOut"
        }, 0.08);
      }
      
      await exitTl;
      
      // Clean up panels
      leftPanel.remove();
      rightPanel.remove();
      panels = null;
      
      // Reset container
      newMain.style.position = '';
      newMain.style.inset = '';
      newMain.style.zIndex = '';
      newMain.style.filter = '';
      newMain.style.transform = '';
      
      // Clear flags
      const heroSection = newMain.querySelector('.home-hero_wrap');
      if (heroSection) {
        delete heroSection.dataset.navigating;
      }
      
      window.scrollTo(0, 0);
      document.body.classList.remove('barba-navigating');
      
      // Run nav animations
      onNavReveal(newMain);
      
      console.log("[SplitScreen] Enter phase complete");
    }
  };
}