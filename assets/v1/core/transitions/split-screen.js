// assets/v1/core/transitions/split-screen.js - FIXED
import { ANIMATION } from "../animation-constants.js";

export function createSplitScreenTransition(options = {}) {
  const { onNavReveal = () => {} } = options;
  
  return {
    async leave({ current, trigger }) {
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
        // Check if it's a project page (has /work/ in URL)
        if (trigger.href.includes('/work/') || trigger.href.includes('/project/')) {
          nextNamespace = 'project';
        } else if (trigger.href === '/' || trigger.href.endsWith('.com/') || trigger.href.endsWith('.com')) {
          nextNamespace = 'home';
        }
      }
      
      // Determine direction based on page hierarchy
      const isForward = currentNamespace === 'home' && nextNamespace === 'project';
      const isBackward = currentNamespace === 'project' && nextNamespace === 'home';
      
      console.log(`[SplitScreen] Direction: ${isForward ? 'forward' : isBackward ? 'backward' : 'lateral'}`);
      console.log(`[SplitScreen] Current: ${currentNamespace}, Next: ${nextNamespace}`);
      
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
      
      // ADD BRAND ELEMENT TO PANELS
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
        userSelect: 'none',
        willChange: 'transform, opacity'
      });
      
      // Add brand to both panels
      leftPanel.appendChild(brandMark.cloneNode(true));
      rightPanel.appendChild(brandMark.cloneNode(true));
      
      const leftBrand = leftPanel.querySelector('.transition-panel__brand');
      const rightBrand = rightPanel.querySelector('.transition-panel__brand');
      
      // Create timeline for entrance
      const tl = gsap.timeline();
      
      // Fade/blur current content
      tl.to(current.container, {
        opacity: 0.3,
        filter: 'blur(8px)',
        scale: isForward ? 0.95 : 1.05,
        duration: 0.5,
        ease: "power2.in"
      }, 0);
      
      // DIRECTION-BASED PANEL ENTRANCE WITH BRAND ANIMATION
      if (isForward) {
        // Going deeper: panels close inward
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
        
        // Subtle brand rotation as panels enter
        tl.fromTo([leftBrand, rightBrand], {
          rotation: 0,
          opacity: 0
        }, {
          rotation: 90,
          opacity: 0.1,
          duration: 0.7,
          ease: "power2.out"
        }, 0.2);
        
      } else if (isBackward) {
        // Going back: panels slide in from outside
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
        
        // Brand scales up as panels slide in
        tl.fromTo([leftBrand, rightBrand], {
          scale: 0.5,
          opacity: 0
        }, {
          scale: 1,
          opacity: 0.1,
          duration: 0.6,
          ease: "back.out(1.2)"
        }, 0.2);
        
      } else {
        // Lateral movement: diagonal wipe
        tl.fromTo(leftPanel, {
          xPercent: -50,
          scaleX: 0
        }, {
          xPercent: 0,
          scaleX: 1,
          duration: 0.5,
          ease: "power3.inOut"
        }, 0);
        
        tl.fromTo(rightPanel, {
          xPercent: 50,
          scaleX: 0
        }, {
          xPercent: 0,
          scaleX: 1,
          duration: 0.5,
          ease: "power3.inOut"
        }, 0.08);
        
        // Brand fades in simply
        tl.fromTo([leftBrand, rightBrand], {
          opacity: 0
        }, {
          opacity: 0.1,
          duration: 0.5,
          ease: "power2.out"
        }, 0.2);
      }
      
      await tl;
      
      // Pass direction info to enter phase
      return { leftPanel, rightPanel, isForward, isBackward };
    },
    
    async enter({ current, next }, leaveData) {
      const { leftPanel, rightPanel, isForward, isBackward } = leaveData;
      const oldMain = current.container;
      const newMain = next.container;
      
      // Get brand elements for exit animation
      const leftBrand = leftPanel.querySelector('.transition-panel__brand');
      const rightBrand = rightPanel.querySelector('.transition-panel__brand');
      
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
        
        if (window.gsap) {
          gsap.set(elementsToHide, {
            opacity: 0,
            visibility: "visible"
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
      
      // Prepare new content based on direction
      gsap.set(newMain, {
        opacity: 0,
        scale: isForward ? 1.05 : isBackward ? 0.95 : 1,
        filter: 'blur(8px)'
      });
      
      // Remove old container
      oldMain.remove();
      
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
      
      // DIRECTION-BASED PANEL EXIT WITH BRAND ANIMATION
      const exitTl = gsap.timeline();
      
      if (isForward) {
        // Fade out brand marks as panels split
        exitTl.to([leftBrand, rightBrand], {
          opacity: 0,
          scale: 1.2,
          duration: 0.4,
          ease: "power2.in"
        }, 0);
        
        // Panels split apart
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
        
      } else if (isBackward) {
        // Rotate brand marks as panels close
        exitTl.to(leftBrand, {
          rotation: -90,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in"
        }, 0);
        
        exitTl.to(rightBrand, {
          rotation: 90,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in"
        }, 0);
        
        // Panels scale back to center
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
        
      } else {
        // Simple fade for brand on lateral movement
        exitTl.to([leftBrand, rightBrand], {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in"
        }, 0);
        
        // Panels slide up and down
        exitTl.to(leftPanel, {
          yPercent: -100,
          duration: 0.6,
          ease: "power3.in"
        }, 0);
        
        exitTl.to(rightPanel, {
          yPercent: 100,
          duration: 0.6,
          ease: "power3.in"
        }, 0.08);
      }
      
      await exitTl;
      
      // Clean up
      leftPanel.remove();
      rightPanel.remove();
      
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
    }
  };
}