// assets/v1/sections/bts-overlay/index.js
// UPDATED: Added mobile scroll prevention while keeping drag functionality
import { populateGrid, cleanupGrid } from "./grid.js";
import { initDragging } from "./dragging.js";

const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

// Body scroll lock helpers
function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overscrollBehavior = 'none';
  document.body.dataset.scrollLocked = 'true';
}

function unlockBodyScroll() {
  if (document.body.dataset.scrollLocked !== 'true') return;
  
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overscrollBehavior = '';
  delete document.body.dataset.scrollLocked;
  
  // Restore scroll position
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
}

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

  // CRITICAL: Populate grid on initialization
  const imageElements = container.querySelectorAll('.bts-images_source .bts-source_img');
  populateGrid(btsOverlay, imageElements);

  // Find player elements
  const playerWrap = container.querySelector('.project-player_wrap');
  const video = playerWrap?.querySelector('video');
  
  let isOpen = false;
  let isAnimating = false;
  let wasPlayingBeforeOpen = false;
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
          
          // Safety timeout
          setTimeout(() => {
            if (pendingOpen && !isOpen && !isAnimating) {
              console.log('[BTSOverlay] CLOSED event timeout (600ms), opening anyway');
              pendingOpen = false;
              performOpen();
            }
          }, 600);
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

    // Lock body scroll on mobile
    if ('ontouchstart' in window) {
      lockBodyScroll();
    }

    // Add data attribute for CSS
    btsOverlay.dataset.open = "true";

    // Store playing state and pause video (but don't mute)
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    if (window.gsap) {
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Set initial states BEFORE making overlay visible
      gsap.set(btsOverlay, { 
        opacity: 0,
        willChange: 'opacity'
      });
      
      // Images start scaled down slightly with blur
      gsap.set(allImages, {
        opacity: 0,
        scale: 0.9,
        filter: "blur(6px)",
        willChange: 'transform, opacity'
      });
      
      // Show the overlay container
      btsOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline with random stagger
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(btsOverlay, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(btsOverlay, { willChange: 'auto' });
        }
      })
      
      // Animate images in with RANDOM STAGGER
      .to(allImages, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.4,
        ease: "power2.out",
        stagger: {
          amount: 0.4,
          from: "random",
          grid: "auto"
        },
        onComplete: () => {
          gsap.set(allImages, { willChange: 'auto' });
        }
      }, "-=0.2") // Overlap with background
      
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

    // Unlock body scroll
    if ('ontouchstart' in window) {
      unlockBodyScroll();
    }

    // Remove data attribute
    delete btsOverlay.dataset.open;

    // Cleanup dragging (in case not already done)
    if (cleanupDragging) {
      cleanupDragging();
      cleanupDragging = null;
    }

    if (window.gsap) {
      const closeTl = gsap.timeline();
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Fast image exit with RANDOM STAGGER
      closeTl.to(allImages, {
        opacity: 0,
        scale: 0.95,
        filter: "blur(4px)",
        duration: 0.3,
        ease: "power2.in",
        stagger: {
          amount: 0.2,
          from: "random"
        }
      })
      
      // Background fade
      .to(btsOverlay, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.inOut"
      }, "-=0.15") // Overlap
      
      // Cleanup
      .call(() => {
        btsOverlay.classList.add('u-display-none');
        isAnimating = false;
        
        // Restore video playing state (but not mute state)
        if (video && wasPlayingBeforeOpen) {
          video.play().catch(() => {});
        }
        
        // Wait a moment before restoring nav state to prevent accidental navigation
        setTimeout(() => {
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
        }, 100);
        
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
      
      // Restore video playing state (but not mute state)
      if (video && wasPlayingBeforeOpen) {
        video.play().catch(() => {});
      }
      
      // Wait a moment before restoring nav state
      setTimeout(() => {
        if (backLink) {
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref || '/');
          backLink.style.cursor = '';
        }

        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });
      }, 100);
      
      if (dispatchComplete) {
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
          detail: { overlay: 'bts', keepBackdrop } 
        }));
        console.log('[BTSOverlay] Closed (no GSAP)');
      }
    }
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

  // Cleanup function
  return () => {
    console.log('[BTSOverlay] Cleanup');
    
    // Ensure body scroll is unlocked
    unlockBodyScroll();
    
    // Kill any dragging
    if (cleanupDragging) {
      cleanupDragging();
    }
    
    // Remove listeners
    handlers.forEach(fn => fn());
    
    // Cleanup grid
    cleanupGrid(btsOverlay);
    
    // Reset state
    delete btsOverlay.dataset.scriptInitialized;
    delete btsOverlay.dataset.open;
  };
}