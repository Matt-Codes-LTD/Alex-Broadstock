// assets/v1/sections/bts-overlay/index.js
// FIXED: Now tracks and restores video mute state
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
  let wasMutedBeforeOpen = false;  // ADDED: Track mute state
  let cleanupDragging = null;
  const handlers = [];

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'bts' && isOpen && !isAnimating) {
      console.log('[BTSOverlay] Received close request from manager');
      // Pass through keepBackdrop flag from manager
      performClose(true, e.detail.keepBackdrop);
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.CLOSING, handleClosing);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.CLOSING, handleClosing));

  // Populate grid on initialization
  const imageElements = container.querySelectorAll('.bts-images_source .bts-source_img');
  populateGrid(btsOverlay, imageElements);

  function open() {
    if (isOpen || isAnimating) return;
    
    console.log('[BTSOverlay] Requesting to open');
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'bts' } 
    }));
    
    // Wait for manager to give us the go-ahead
    let waitingForManager = false;
    const onManagerReady = () => {
      waitingForManager = true;
      performOpen();
    };
    
    window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onManagerReady, { once: true });
    
    // Timeout - if manager doesn't respond, just open
    setTimeout(() => {
      window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onManagerReady);
      if (!waitingForManager && !isOpen && !isAnimating) {
        console.log('[BTSOverlay] Manager timeout, opening anyway');
        performOpen();
      }
    }, 100);
  }

  function performOpen() {
    if (isOpen || isAnimating) return;
    isOpen = true;
    isAnimating = true;

    console.log('[BTSOverlay] Opening');

    // ADDED: Store both playing and mute state
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      wasMutedBeforeOpen = video.muted;  // Store mute state
      
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    // Handle background and content entrance
    if (window.gsap) {
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Set initial states BEFORE making overlay visible
      gsap.set(btsOverlay, { opacity: 0 });
      
      gsap.set(allImages, {
        opacity: 0,
        scale: 0.85,
        filter: "blur(8px)"
      });
      
      // Show the overlay container
      btsOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(btsOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      })
      
      // Animate images in
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
      }, "-=0.3")
      
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
    // Start dragging functionality
    cleanupDragging = initDragging(btsOverlay);
    isAnimating = false;
    
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
      detail: { overlay: 'bts' } 
    }));
    console.log('[BTSOverlay] Opened');
  }

  function close() {
    if (!isOpen || isAnimating) return;
    performClose(true, false);  // Normal close, hide backdrop
  }

  function performClose(dispatchComplete, keepBackdrop = false) {
    isOpen = false;
    isAnimating = true;

    console.log('[BTSOverlay] Closing, keepBackdrop:', keepBackdrop);

    // Cleanup dragging
    if (cleanupDragging) {
      cleanupDragging();
      cleanupDragging = null;
    }

    if (window.gsap) {
      const closeTl = gsap.timeline();
      const allImages = btsOverlay.querySelectorAll('.bts-grid_img');
      
      // Fast image exit with stagger
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
      
      // Gentle background fade
      .to(btsOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.5")
      
      // Cleanup
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

        // UPDATED: Restore video with proper mute state
        if (video && wasPlayingBeforeOpen) {
          // Restore mute state BEFORE playing
          if (!wasMutedBeforeOpen) {
            video.muted = false;
            video.removeAttribute('muted');
          }
          video.play().catch(() => {});
        }
        
        // Reset image and overlay states
        gsap.set(allImages, { clearProps: "transform,filter,opacity,scale" });
        gsap.set(btsOverlay, { clearProps: "transform,filter" });
        
        isAnimating = false;
        
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { 
              overlay: 'bts',
              keepBackdrop: keepBackdrop  // Pass flag to manager
            } 
          }));
          console.log('[BTSOverlay] Closed');
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

      // UPDATED: Restore video with proper mute state
      if (video && wasPlayingBeforeOpen) {
        // Restore mute state BEFORE playing
        if (!wasMutedBeforeOpen) {
          video.muted = false;
          video.removeAttribute('muted');
        }
        video.play().catch(() => {});
      }
      
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