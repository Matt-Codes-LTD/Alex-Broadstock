// assets/v1/sections/bts-overlay/index.js
// UPDATED: 50% faster with aggressive easing
import { populateGrid, cleanupGrid } from "./grid.js";
import { initDragging } from "./dragging.js";

const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

export default function initBTSOverlay(container) {
  // Only run on project pages
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const navWrap = container.querySelector('.nav_wrap');
  if (!navWrap) return () => {};
  
  const btsOverlay = container.querySelector('.bts-overlay');
  if (!btsOverlay) {
    console.warn('[BTSOverlay] No overlay element found');
    return () => {};
  }
  
  // Find the BTS button and Back link
  const navLinks = container.querySelectorAll('.nav_link');
  const btsButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'BTS'
  );
  const backLink = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Back'
  );
  
  if (!btsButton) {
    console.warn('[BTSOverlay] BTS button not found');
    return () => {};
  }
  
  if (btsOverlay.dataset.scriptInitialized) return () => {};
  btsOverlay.dataset.scriptInitialized = "true";
  
  let originalBackHref = backLink?.getAttribute('href');

  // Find player elements
  const playerWrap = container.querySelector('.project-player_wrap');
  const video = playerWrap?.querySelector('video');
  
  let isOpen = false;
  let isAnimating = false;
  let wasPlayingBeforeOpen = false;
  let wasMutedBeforeOpen = false;
  let cleanupDragging = null;
  let pendingOpen = false;
  const handlers = [];

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'bts' && isOpen) {
      console.log('[BTSOverlay] Received close request from manager (isAnimating:', isAnimating, ')');
      
      // Kill any in-progress dragging
      if (cleanupDragging) {
        cleanupDragging();
        cleanupDragging = null;
      }
      
      performClose(true, e.detail.keepBackdrop);
    }
  };
  
  // Listen for CLOSED event to know when safe to open
  const handleClosed = (e) => {
    if (pendingOpen && e.detail.keepBackdrop && e.detail.overlay !== 'bts') {
      console.log('[BTSOverlay] Previous overlay closed, now opening');
      pendingOpen = false;
      performOpen();
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.CLOSING, handleClosing);
  window.addEventListener(OVERLAY_EVENTS.CLOSED, handleClosed);
  handlers.push(() => {
    window.removeEventListener(OVERLAY_EVENTS.CLOSING, handleClosing);
    window.removeEventListener(OVERLAY_EVENTS.CLOSED, handleClosed);
  });

  function open() {
    if (isOpen || isAnimating || pendingOpen) return;
    
    console.log('[BTSOverlay] Requesting to open');
    
    // Dispatch request to manager
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'bts' } 
    }));
    
    // Smart detection - check if another overlay is currently open
    setTimeout(() => {
      if (!isOpen && !isAnimating) {
        // Check if any other overlay is visible
        const otherOverlays = [
          container.querySelector('.project-info_overlay'),
          container.querySelector('.about-overlay')
        ].filter(Boolean);
        
        const isAnotherOverlayOpen = otherOverlays.some(overlay => 
          !overlay.classList.contains('u-display-none')
        );
        
        if (isAnotherOverlayOpen) {
          // Another overlay is open, wait for CLOSED event
          console.log('[BTSOverlay] Another overlay open, waiting for close');
          pendingOpen = true;
          
          // Safety timeout - if CLOSED event doesn't arrive in 1200ms, open anyway
          setTimeout(() => {
            if (pendingOpen && !isOpen && !isAnimating) {
              console.log('[BTSOverlay] CLOSED event timeout (1200ms), opening anyway');
              pendingOpen = false;
              performOpen();
            }
          }, 1200);
        } else {
          // No other overlay open, safe to open immediately
          console.log('[BTSOverlay] No other overlay, opening immediately');
          performOpen();
        }
      }
    }, 10);
  }

  function performOpen() {
    if (isOpen || isAnimating) {
      pendingOpen = false;
      return;
    }
    
    isOpen = true;
    isAnimating = true;
    pendingOpen = false;

    console.log('[BTSOverlay] Opening');

    // Store both playing and mute state
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      wasMutedBeforeOpen = video.muted;
      
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    if (window.gsap) {
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Set initial states BEFORE making overlay visible
      gsap.set(btsOverlay, { 
        opacity: 0,
        willChange: 'transform, opacity' // Performance
      });
      
      gsap.set(allImages, {
        opacity: 0,
        scale: 0.85,
        filter: "blur(8px)",
        willChange: 'transform, opacity' // Performance
      });
      
      // Show the overlay container
      btsOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline - FASTER & SNAPPIER
      const entranceTl = gsap.timeline();
      
      // Fade background in - 50% FASTER
      entranceTl.to(btsOverlay, {
        opacity: 1,
        duration: 0.25, // Was 0.5
        ease: "power4.out", // More aggressive
        onComplete: () => {
          gsap.set(btsOverlay, { willChange: 'auto' });
        }
      })
      
      // Animate images in - 50% FASTER
      .to(allImages, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.25, // Was 0.5
        ease: "power4.out", // More aggressive
        stagger: {
          amount: 0.3, // Was 0.6 - 50% FASTER
          from: "random",
          grid: "auto"
        },
        onComplete: () => {
          gsap.set(allImages, { willChange: 'auto' });
        }
      }, "-=0.15") // Tighter overlap
      
      // Enable dragging
      .call(() => {
        initializeDragging();
      });
      
    } else {
      btsOverlay.classList.remove('u-display-none');
      initializeDragging();
    }

    // Fade other nav links
    navLinks.forEach(link => {
      if (link !== btsButton) {
        link.classList.add('u-color-faded');
      }
    });

    // Change Back to Close
    if (backLink) {
      backLink.textContent = 'Close';
      backLink.removeAttribute('href');
      backLink.style.cursor = 'pointer';
    }
  }

  function initializeDragging() {
    cleanupDragging = initDragging(btsOverlay);
    isAnimating = false;
    
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
      detail: { overlay: 'bts' } 
    }));
    console.log('[BTSOverlay] Opened');
  }

  function close() {
    if (!isOpen) return;
    
    // Kill any in-progress dragging
    if (cleanupDragging) {
      cleanupDragging();
      cleanupDragging = null;
    }
    
    performClose(true, false);
  }

  function performClose(dispatchComplete, keepBackdrop = false) {
    if (!isOpen) return;
    
    isOpen = false;
    isAnimating = true;
    pendingOpen = false;

    console.log('[BTSOverlay] Closing, keepBackdrop:', keepBackdrop);

    // Cleanup dragging (in case not already done)
    if (cleanupDragging) {
      cleanupDragging();
      cleanupDragging = null;
    }

    if (window.gsap) {
      // Add will-change for performance
      gsap.set(btsOverlay, { willChange: 'transform, opacity' });
      
      const closeTl = gsap.timeline();
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Fast image exit with stagger - 50% FASTER
      closeTl.to(allImages, {
        opacity: 0,
        scale: 0.9,
        filter: "blur(6px)",
        duration: 0.125, // Was 0.25 - 50% FASTER
        ease: "power4.in", // More aggressive
        stagger: {
          amount: 0.075, // Was 0.15 - 50% FASTER
          from: "random"
        }
      })
      
      // Background fade - 50% FASTER
      .to(btsOverlay, {
        opacity: 0,
        duration: 0.35, // Was 0.7
        ease: "power4.inOut" // More aggressive
      }, "-=0.05")
      
      // Cleanup
      .call(() => {
        btsOverlay.classList.add('u-display-none');
        isAnimating = false;
        
        // Remove will-change
        gsap.set(btsOverlay, { willChange: 'auto' });
        gsap.set(allImages, { willChange: 'auto' });
        
        // Restore video state
        if (video) {
          if (wasPlayingBeforeOpen) {
            video.play().catch(() => {});
          }
          video.muted = wasMutedBeforeOpen;
          if (wasMutedBeforeOpen) {
            video.setAttribute('muted', '');
          } else {
            video.removeAttribute('muted');
          }
        }
        
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { overlay: 'bts', keepBackdrop } 
          }));
          console.log('[BTSOverlay] Closed');
        }
      });
      
    } else {
      btsOverlay.classList.add('u-display-none');
      isAnimating = false;
      
      if (video) {
        if (wasPlayingBeforeOpen) {
          video.play().catch(() => {});
        }
        video.muted = wasMutedBeforeOpen;
        if (wasMutedBeforeOpen) {
          video.setAttribute('muted', '');
        } else {
          video.removeAttribute('muted');
        }
      }
      
      if (dispatchComplete) {
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
          detail: { overlay: 'bts', keepBackdrop } 
        }));
        console.log('[BTSOverlay] Closed (no GSAP)');
      }
    }

    // Reset Back link
    if (backLink) {
      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref || '/');
      backLink.style.cursor = '';
    }

    // Restore nav link colors
    navLinks.forEach(link => {
      link.classList.remove('u-color-faded');
    });
  }

  // Event listeners
  btsButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  // Back link as close
  if (backLink) {
    const handleBackClick = (e) => {
      if (isOpen) {
        e.preventDefault();
        close();
      }
    };
    backLink.addEventListener('click', handleBackClick);
    handlers.push(() => backLink.removeEventListener('click', handleBackClick));
  }

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
    if (cleanupDragging) {
      cleanupDragging();
    }
    delete btsOverlay.dataset.scriptInitialized;
  };
}