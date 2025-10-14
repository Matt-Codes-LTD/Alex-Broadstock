// assets/v1/sections/bts-overlay/index.js
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
  const playerControls = container.querySelector('.project-player_controls');
  const navigationOverlay = container.querySelector('.project-navigation_overlay');
  const centerToggle = container.querySelector('.project-player_center-toggle');
  const pausefx = container.querySelector('.project-player_pausefx');
  
  let isOpen = false;
  let isAnimating = false;
  let wasPlayingBeforeOpen = false;
  let cleanupDragging = null;
  const handlers = [];

  // Listen for other overlays requesting to open
  const handleOverlayRequest = (e) => {
    if (e.detail.overlay !== 'bts' && isOpen && !isAnimating) {
      closeForTransition();
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest));

  // Populate grid on initialization
  const imageElements = container.querySelectorAll('.bts-images_source .bts-source_img');
  populateGrid(btsOverlay, imageElements);

  function open() {
    if (isOpen || isAnimating) return;
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'bts' } 
    }));
    
    // Wait for other overlay to FULLY close
    let waitingForOther = false;
    const onOtherClosed = () => {
      waitingForOther = true;
      // Open normally after other overlay is fully closed
      performOpen(false);
    };
    
    // Listen for CLOSED event (not CLOSING)
    window.addEventListener(OVERLAY_EVENTS.CLOSED, onOtherClosed, { once: true });
    
    // Short timeout - if no overlay responds quickly, just open
    // If another overlay IS open, it will dispatch CLOSED before this timeout
    setTimeout(() => {
      window.removeEventListener(OVERLAY_EVENTS.CLOSED, onOtherClosed);
      if (!waitingForOther && !isOpen && !isAnimating) {
        performOpen(false);
      }
    }, 50);  // Quick timeout - CLOSED event will override if another overlay is open
  }

  function performOpen(isCrossFade) {
    if (isOpen || isAnimating) return;
    isOpen = true;
    isAnimating = true;

    // Handle video
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    // Show pausefx
    if (pausefx) {
      if (window.gsap) {
        gsap.to(pausefx, { opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        pausefx.style.opacity = '1';
      }
    }

    // Handle background and content entrance
    if (window.gsap) {
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // CRITICAL: Set initial states BEFORE making overlay visible
      // Hide overlay background
      gsap.set(btsOverlay, { opacity: 0 });
      
      // Set initial state for images
      gsap.set(allImages, {
        opacity: 0,
        scale: 0.85,
        filter: "blur(8px)"
      });
      
      // NOW show the overlay container (but it's transparent)
      btsOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Step 1: Fade background in
      entranceTl.to(btsOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      })
      
      // Step 2: Animate images in (after background is visible)
      .to(allImages, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power2.out",
        stagger: {
          amount: 0.6,
          from: "random",
          grid: "auto"
        }
      }, "-=0.3")  // Slight overlap
      
      // Step 3: Enable dragging
      .call(() => {
        initializeDragging();
      });
      
    } else {
      // No GSAP fallback
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

    // Hide player controls
    if (window.gsap) {
      if (playerControls || navigationOverlay || centerToggle) {
        gsap.to([playerControls, navigationOverlay, centerToggle].filter(Boolean), {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    }
  }

  function initializeDragging() {
    // Start dragging functionality
    cleanupDragging = initDragging(btsOverlay);
    isAnimating = false;
    
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
      detail: { overlay: 'bts' } 
    }));
  }

  function close() {
    if (!isOpen || isAnimating) return;
    performClose(true);
  }

  function closeForTransition() {
    if (!isOpen || isAnimating) return;
    
    // Notify that we're closing
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSING, { 
      detail: { overlay: 'bts' } 
    }));
    
    // Close and ALWAYS dispatch CLOSED when done
    performClose(true);
  }

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    // Cleanup dragging
    if (cleanupDragging) {
      cleanupDragging();
      cleanupDragging = null;
    }

    if (window.gsap) {
      const closeTl = gsap.timeline();
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Step 1: FAST image exit with stagger
      closeTl.to(allImages, {
        opacity: 0,
        scale: 0.9,
        filter: "blur(6px)",
        duration: 0.25,
        ease: "power3.in",
        stagger: {
          amount: 0.15,
          from: "random"
        }
      })
      
      // Step 2: GENTLE background fade
      .to(btsOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.5")  // Start while images are still fading
      
      // Step 3: Cleanup
      .call(() => {
        btsOverlay.classList.add('u-display-none');
        
        // Restore nav states
        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });

        // Restore Back link
        if (backLink) {
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref);
          backLink.style.cursor = '';
        }

        // Hide pausefx
        if (pausefx) pausefx.style.opacity = '0';

        // Restore video
        if (video && wasPlayingBeforeOpen) {
          video.play().catch(() => {});
        }

        // Show player controls
        if (playerControls) playerControls.style.opacity = '1';
        if (navigationOverlay) navigationOverlay.style.opacity = '1';
        if (centerToggle) centerToggle.style.opacity = '1';
        
        // Reset image and overlay states - only clear animation properties
        gsap.set(allImages, { clearProps: "transform,filter,opacity,scale" });
        gsap.set(btsOverlay, { clearProps: "transform,filter" });
        
        isAnimating = false;
        
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { overlay: 'bts' } 
          }));
        }
      });
    } else {
      // No animation fallback
      btsOverlay.classList.add('u-display-none');
      
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

      if (backLink) {
        backLink.textContent = 'Back';
        backLink.setAttribute('href', originalBackHref);
        backLink.style.cursor = '';
      }

      if (pausefx) pausefx.style.opacity = '0';
      if (video && wasPlayingBeforeOpen) video.play().catch(() => {});
      if (playerControls) playerControls.style.opacity = '1';
      if (navigationOverlay) navigationOverlay.style.opacity = '1';
      if (centerToggle) centerToggle.style.opacity = '1';
      
      isAnimating = false;
    }
  }

  // Event handlers
  const onBTSClick = (e) => {
    e.preventDefault();
    isOpen ? close() : open();
  };

  const onBackClick = (e) => {
    if (isOpen) {
      e.preventDefault();
      close();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  };

  const onOverlayClick = (e) => {
    if (e.target === btsOverlay) {
      close();
    }
  };

  btsButton.addEventListener('click', onBTSClick);
  if (backLink) {
    backLink.addEventListener('click', onBackClick);
  }
  document.addEventListener('keydown', onKeyDown);
  btsOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    btsButton.removeEventListener('click', onBTSClick);
    if (backLink) {
      backLink.removeEventListener('click', onBackClick);
    }
    document.removeEventListener('keydown', onKeyDown);
    btsOverlay.removeEventListener('click', onOverlayClick);
  });

  return () => {
    if (cleanupDragging) cleanupDragging();
    cleanupGrid(btsOverlay);
    handlers.forEach(fn => fn());
    delete btsOverlay.dataset.scriptInitialized;
  };
}