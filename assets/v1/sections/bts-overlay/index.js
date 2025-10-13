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
  
  // Find the BTS button
  const navLinks = container.querySelectorAll('.nav_link');
  const btsButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'BTS'
  );
  
  if (!btsButton) {
    console.warn('[BTSOverlay] BTS button not found');
    return () => {};
  }
  
  if (btsOverlay.dataset.scriptInitialized) return () => {};
  btsOverlay.dataset.scriptInitialized = "true";

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
    
    let waitingForOther = false;
    const onOtherClosing = () => {
      waitingForOther = true;
      performOpen(true);
    };
    
    window.addEventListener(OVERLAY_EVENTS.CLOSING, onOtherClosing, { once: true });
    
    setTimeout(() => {
      window.removeEventListener(OVERLAY_EVENTS.CLOSING, onOtherClosing);
      if (!waitingForOther && !isOpen && !isAnimating) {
        performOpen(false);
      }
    }, 100);
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

    // Show overlay
    btsOverlay.classList.remove('u-display-none');
    
    if (isCrossFade && window.gsap) {
      gsap.set(btsOverlay, { opacity: 0 });
      gsap.to(btsOverlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          initializeDragging();
        }
      });
    } else {
      initializeDragging();
    }

    // Fade other nav links
    navLinks.forEach(link => {
      if (link !== btsButton) {
        link.classList.add('u-color-faded');
      }
    });

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
    
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSING, { 
      detail: { overlay: 'bts' } 
    }));
    
    performClose(false);
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
      gsap.to(btsOverlay, {
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          btsOverlay.classList.add('u-display-none');
          
          // Restore nav states
          navLinks.forEach(link => {
            link.classList.remove('u-color-faded');
          });

          // Hide pausefx
          if (pausefx) {
            pausefx.style.opacity = '0';
          }

          // Restore video
          if (video && wasPlayingBeforeOpen) {
            video.play().catch(() => {});
          }

          // Show player controls
          if (playerControls) playerControls.style.opacity = '1';
          if (navigationOverlay) navigationOverlay.style.opacity = '1';
          if (centerToggle) centerToggle.style.opacity = '1';
          
          isAnimating = false;
          
          if (dispatchComplete) {
            window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
              detail: { overlay: 'bts' } 
            }));
          }
        }
      });
    } else {
      btsOverlay.classList.add('u-display-none');
      
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

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
  document.addEventListener('keydown', onKeyDown);
  btsOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    btsButton.removeEventListener('click', onBTSClick);
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