// assets/v1/sections/overlay-manager/index.js
// UPDATED: 50% faster backdrop with aggressive easing
// Centralized overlay coordination and backdrop management

const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

export function initOverlayManager(container) {
  // Try to find backdrop elements for both page types
  const pausefx = container.querySelector('.project-player_pausefx');
  const homeBackdrop = document.querySelector('.home-hero_backdrop'); // Home page backdrop
  const playerControls = container.querySelector('.project-player_controls');
  const navigationOverlay = container.querySelector('.project-navigation_overlay');
  const centerToggle = container.querySelector('.project-player_center-toggle');
  const video = container.querySelector('video');
  
  // Determine which backdrop to use
  const backdrop = pausefx || homeBackdrop;
  const isProjectPage = !!pausefx;
  const isHomePage = !!homeBackdrop;
  
  if (!backdrop) {
    console.warn('[OverlayManager] No backdrop element found (neither pausefx nor home-hero_backdrop)');
    return () => {};
  }

  console.log('[OverlayManager] Initialized for', isProjectPage ? 'project page' : 'home page');

  let activeOverlay = null;
  let openCount = 0;
  let isTransitioning = false;
  const handlers = [];

  // Show backdrop (called when first overlay opens) - 50% FASTER
  function showBackdrop() {
    console.log('[OverlayManager] Showing backdrop');
    
    if (window.gsap) {
      // Add will-change for performance
      gsap.set(backdrop, { willChange: 'transform, opacity' });
      
      gsap.to(backdrop, { 
        opacity: 1, 
        duration: 0.15, // Was 0.3 - 50% FASTER
        ease: "power4.out", // More aggressive
        onComplete: () => {
          gsap.set(backdrop, { willChange: 'auto' });
        }
      });
    } else {
      backdrop.style.opacity = '1';
    }

    // Hide player UI (only on project pages) - 50% FASTER
    if (isProjectPage && (playerControls || navigationOverlay || centerToggle)) {
      const targets = [playerControls, navigationOverlay, centerToggle].filter(Boolean);
      if (window.gsap) {
        gsap.set(targets, { willChange: 'transform, opacity' });
        
        gsap.to(targets, {
          opacity: 0,
          duration: 0.15, // Was 0.3 - 50% FASTER
          ease: "power4.out", // More aggressive
          onComplete: () => {
            gsap.set(targets, { willChange: 'auto' });
          }
        });
      } else {
        targets.forEach(el => el.style.opacity = '0');
      }
    }
  }

  // Hide backdrop (called when last overlay closes) - 50% FASTER
  function hideBackdrop() {
    console.log('[OverlayManager] Hiding backdrop');
    
    if (window.gsap) {
      // Add will-change for performance
      gsap.set(backdrop, { willChange: 'transform, opacity' });
      
      gsap.to(backdrop, { 
        opacity: 0, 
        duration: 0.15, // Was 0.3 - 50% FASTER
        ease: "power4.inOut", // More aggressive
        onComplete: () => {
          gsap.set(backdrop, { willChange: 'auto' });
        }
      });
    } else {
      backdrop.style.opacity = '0';
    }

    // Restore player UI (only on project pages) - 50% FASTER
    if (isProjectPage && (playerControls || navigationOverlay || centerToggle)) {
      const targets = [playerControls, navigationOverlay, centerToggle].filter(Boolean);
      if (window.gsap) {
        gsap.set(targets, { willChange: 'transform, opacity' });
        
        gsap.to(targets, {
          opacity: 1,
          duration: 0.15, // Was 0.3 - 50% FASTER
          ease: "power4.out", // More aggressive
          onComplete: () => {
            gsap.set(targets, { willChange: 'auto' });
          }
        });
      } else {
        targets.forEach(el => el.style.opacity = '1');
      }
    }
  }

  // Handle overlay open request
  const handleRequestOpen = (e) => {
    const requestedOverlay = e.detail.overlay;
    console.log('[OverlayManager] Open request:', requestedOverlay, '| Active:', activeOverlay);

    if (isTransitioning) {
      console.log('[OverlayManager] Already transitioning, ignoring request');
      return;
    }

    // If another overlay is open, close it first
    if (activeOverlay && activeOverlay !== requestedOverlay) {
      console.log('[OverlayManager] Closing', activeOverlay, 'to open', requestedOverlay);
      isTransitioning = true;
      
      // Tell the current overlay to close (keepBackdrop = true)
      window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSING, { 
        detail: { 
          overlay: activeOverlay, 
          keepBackdrop: true 
        } 
      }));
    } else if (!activeOverlay) {
      // No overlay open, show backdrop
      console.log('[OverlayManager] No active overlay, showing backdrop');
      showBackdrop();
    }

    activeOverlay = requestedOverlay;
  };

  // Handle overlay opened
  const handleOpened = (e) => {
    const overlay = e.detail.overlay;
    console.log('[OverlayManager] Overlay opened:', overlay);
    
    openCount++;
    isTransitioning = false;
    
    if (openCount === 1) {
      console.log('[OverlayManager] First overlay opened, backdrop should be visible');
    }
  };

  // Handle overlay closed
  const handleClosed = (e) => {
    const overlay = e.detail.overlay;
    const keepBackdrop = e.detail.keepBackdrop;
    
    console.log('[OverlayManager] Overlay closed:', overlay, '| keepBackdrop:', keepBackdrop);
    
    openCount = Math.max(0, openCount - 1);
    
    if (activeOverlay === overlay) {
      activeOverlay = null;
    }
    
    // Only hide backdrop if no overlays are open and not switching
    if (openCount === 0 && !keepBackdrop) {
      console.log('[OverlayManager] All overlays closed, hiding backdrop');
      hideBackdrop();
    }
    
    isTransitioning = false;
  };

  // Register event listeners
  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleRequestOpen);
  window.addEventListener(OVERLAY_EVENTS.OPENED, handleOpened);
  window.addEventListener(OVERLAY_EVENTS.CLOSED, handleClosed);
  
  handlers.push(() => {
    window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleRequestOpen);
    window.removeEventListener(OVERLAY_EVENTS.OPENED, handleOpened);
    window.removeEventListener(OVERLAY_EVENTS.CLOSED, handleClosed);
  });

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
  };
}