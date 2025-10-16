// assets/v1/sections/overlay-manager/index.js
// Centralized overlay coordination and backdrop management
// FIXED: Now works on both home and project pages with proper backdrop

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

  // Show backdrop (called when first overlay opens)
  function showBackdrop() {
    console.log('[OverlayManager] Showing backdrop');
    
    if (window.gsap) {
      gsap.to(backdrop, { 
        opacity: 1, 
        duration: 0.3, 
        ease: "power2.out" 
      });
    } else {
      backdrop.style.opacity = '1';
    }

    // Hide player UI (only on project pages)
    if (isProjectPage && (playerControls || navigationOverlay || centerToggle)) {
      const targets = [playerControls, navigationOverlay, centerToggle].filter(Boolean);
      if (window.gsap) {
        gsap.to(targets, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        targets.forEach(el => el.style.opacity = '0');
      }
    }
  }

  // Hide backdrop (called when last overlay closes)
  function hideBackdrop() {
    console.log('[OverlayManager] Hiding backdrop');
    
    if (window.gsap) {
      gsap.to(backdrop, { 
        opacity: 0, 
        duration: 0.3, 
        ease: "power2.in" 
      });
    } else {
      backdrop.style.opacity = '0';
    }

    // Restore player UI (only on project pages)
    if (isProjectPage && (playerControls || navigationOverlay || centerToggle)) {
      const targets = [playerControls, navigationOverlay, centerToggle].filter(Boolean);
      if (window.gsap) {
        gsap.to(targets, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        targets.forEach(el => el.style.opacity = '1');
      }
    }
  }

  // Handle overlay open requests
  const onRequestOpen = async (e) => {
    const requestedOverlay = e.detail.overlay;
    
    console.log('[OverlayManager] Open requested:', requestedOverlay, 'current:', activeOverlay);

    // If same overlay, ignore
    if (activeOverlay === requestedOverlay) {
      console.log('[OverlayManager] Same overlay already open, ignoring');
      return;
    }

    // If transitioning, queue or ignore
    if (isTransitioning) {
      console.log('[OverlayManager] Transition in progress, ignoring request');
      return;
    }

    isTransitioning = true;

    // If another overlay is open, close it first WITHOUT hiding backdrop
    if (activeOverlay && activeOverlay !== requestedOverlay) {
      console.log('[OverlayManager] Closing current overlay:', activeOverlay);
      
      // CRITICAL: Keep backdrop visible during transition
      window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSING, {
        detail: { 
          overlay: activeOverlay,
          keepBackdrop: true  // Signal to NOT hide backdrop
        }
      }));

      // Wait for close to complete
      await new Promise(resolve => {
        const onClosed = (e) => {
          if (e.detail.overlay === activeOverlay) {
            window.removeEventListener(OVERLAY_EVENTS.CLOSED, onClosed);
            console.log('[OverlayManager] Previous overlay close confirmed');
            resolve();
          }
        };
        window.addEventListener(OVERLAY_EVENTS.CLOSED, onClosed);
        
        // Timeout fallback
        setTimeout(() => {
          console.warn('[OverlayManager] Close timeout, proceeding anyway');
          resolve();
        }, 1500);
      });

      console.log('[OverlayManager] Previous overlay closed, ready for next');
      // DON'T call hideBackdrop here - backdrop stays visible
      activeOverlay = null;
    } else {
      // First overlay opening - show backdrop normally
      showBackdrop();
    }

    // Update state
    activeOverlay = requestedOverlay;
    openCount = 1;

    isTransitioning = false;
    console.log('[OverlayManager] Ready for overlay to open');
  };

  // Handle overlay opened
  const onOpened = (e) => {
    console.log('[OverlayManager] Overlay opened:', e.detail.overlay);
    activeOverlay = e.detail.overlay;
  };

  // Handle overlay closed
  const onClosed = (e) => {
    console.log('[OverlayManager] Overlay closed:', e.detail.overlay);
    
    // Only hide backdrop if no keepBackdrop flag (meaning truly closing, not switching)
    if (e.detail.overlay === activeOverlay && !e.detail.keepBackdrop) {
      activeOverlay = null;
      openCount = 0;
      hideBackdrop();
    }
  };

  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onRequestOpen);
  window.addEventListener(OVERLAY_EVENTS.OPENED, onOpened);
  window.addEventListener(OVERLAY_EVENTS.CLOSED, onClosed);

  handlers.push(() => {
    window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onRequestOpen);
    window.removeEventListener(OVERLAY_EVENTS.OPENED, onOpened);
    window.removeEventListener(OVERLAY_EVENTS.CLOSED, onClosed);
  });

  return () => {
    handlers.forEach(fn => fn());
    openCount = 0;
    activeOverlay = null;
    isTransitioning = false;
  };
}