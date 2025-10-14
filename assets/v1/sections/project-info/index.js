// assets/v1/sections/project-info/index.js
import { createRevealAnimation } from "./animations.js";

// Overlay coordination events
const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

export default function initProjectInfo(container) {
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const playerWrap = container.querySelector('.project-player_wrap');
  const infoOverlay = container.querySelector('.project-info_overlay');
  
  // Find the Info button and Back link
  const navLinks = container.querySelectorAll('.nav_link');
  const infoButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Info'
  );
  const backLink = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Back'
  );
  
  // Find player controls
  const playerControls = container.querySelector('.project-player_controls');
  const navigationOverlay = container.querySelector('.project-navigation_overlay');
  const centerToggle = container.querySelector('.project-player_center-toggle');
  const pausefx = container.querySelector('.project-player_pausefx');
  
  if (!playerWrap || !infoOverlay || !infoButton || !backLink) {
    console.warn('[ProjectInfo] Missing required elements');
    return () => {};
  }
  
  if (infoOverlay.dataset.scriptInitialized) return () => {};
  infoOverlay.dataset.scriptInitialized = "true";

  const video = playerWrap.querySelector('video');
  let isOpen = false;
  let isAnimating = false;
  let revealTimeline = null;
  let originalBackHref = backLink.getAttribute('href');
  let wasMutedBeforeOpen = false;
  const handlers = [];

  // Listen for other overlays requesting to open
  const handleOverlayRequest = (e) => {
    if (e.detail.overlay !== 'info' && isOpen && !isAnimating) {
      closeForTransition();
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest));

  function open() {
    if (isOpen || isAnimating) return;
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'info' } 
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

    // Store mute state and mute video (but keep playing)
    if (video) {
      wasMutedBeforeOpen = video.muted;
      video.muted = true;
      video.setAttribute('muted', '');
      
      // If video was paused, start playing
      if (video.paused) {
        video.play().catch(() => {});
      }
    }

    // Force pausefx overlay to show
    if (pausefx) {
      if (window.gsap) {
        gsap.to(pausefx, { opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        pausefx.style.opacity = '1';
      }
    }

    // Handle background and content entrance
    if (window.gsap) {
      // CRITICAL: Set initial states BEFORE making overlay visible
      // Hide overlay background
      gsap.set(infoOverlay, { opacity: 0 });
      
      // Hide all content elements
      gsap.set([
        '.project-info_description',
        '.project-info_crew-label',
        '.project-info_crew-role',
        '.project-info_crew-name',
        '.project-info_awards-label',
        '.project-info_award-item'
      ], {
        opacity: 0,
        y: 15,
        filter: "blur(6px)"
      });
      
      // NOW show the overlay container (but it's transparent)
      infoOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Step 1: Fade background in
      entranceTl.to(infoOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      })
      
      // Step 2: Animate content in (after background is visible)
      .add(() => {
        runContentReveal();
      });
      
    } else {
      // No GSAP fallback
      infoOverlay.classList.remove('u-display-none');
      runContentReveal();
    }

    // Update nav states
    navLinks.forEach(link => {
      if (link !== infoButton) {
        link.classList.add('u-color-faded');
      }
    });

    // Change Back to Close
    backLink.textContent = 'Close';
    backLink.removeAttribute('href');
    backLink.style.cursor = 'pointer';

    // Hide player controls
    if (window.gsap) {
      gsap.to([playerControls, navigationOverlay, centerToggle], {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    } else {
      if (playerControls) playerControls.style.opacity = '0';
      if (navigationOverlay) navigationOverlay.style.opacity = '0';
      if (centerToggle) centerToggle.style.opacity = '0';
    }
  }

  function runContentReveal() {
    if (window.gsap) {
      revealTimeline = createRevealAnimation(infoOverlay);
      if (revealTimeline) {
        revealTimeline.eventCallback('onComplete', () => {
          isAnimating = false;
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
            detail: { overlay: 'info' } 
          }));
        });
      } else {
        isAnimating = false;
      }
    } else {
      isAnimating = false;
    }
  }

  function close() {
    if (!isOpen || isAnimating) return;
    performClose(true);
  }

  function closeForTransition() {
    if (!isOpen || isAnimating) return;
    
    // Notify that we're closing
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSING, { 
      detail: { overlay: 'info' } 
    }));
    
    // Close and ALWAYS dispatch CLOSED when done
    performClose(true);
  }

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    if (window.gsap && revealTimeline) {
      const closeTl = gsap.timeline();
      
      // Step 1: FAST content exit (snappy)
      closeTl.to([
        '.project-info_award-item',
        '.project-info_awards-label',
        '.project-info_crew-name',
        '.project-info_crew-role',
        '.project-info_crew-label',
        '.project-info_description'
      ], {
        opacity: 0,
        y: -8,
        filter: "blur(4px)",
        duration: 0.22,
        stagger: 0.015,
        ease: "power3.in"
      })
      
      // Step 2: GENTLE background fade (smooth)
      .to(infoOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.1")
      
      // Step 3: Cleanup
      .call(() => {
        infoOverlay.classList.add('u-display-none');
        
        // Restore nav states
        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });

        // Restore Back link
        backLink.textContent = 'Back';
        backLink.setAttribute('href', originalBackHref);
        backLink.style.cursor = '';

        // Hide pausefx overlay
        if (pausefx) {
          pausefx.style.opacity = '0';
        }

        // Restore video mute state
        if (video && !wasMutedBeforeOpen) {
          video.muted = false;
          video.removeAttribute('muted');
        }

        // Show player controls again
        if (playerControls) playerControls.style.opacity = '1';
        if (navigationOverlay) navigationOverlay.style.opacity = '1';
        if (centerToggle) centerToggle.style.opacity = '1';

        // Clear props - only clear animation properties, not display/visibility
        gsap.set([
          '.project-info_description',
          '.project-info_crew-label',
          '.project-info_crew-role',
          '.project-info_crew-name',
          '.project-info_awards-label',
          '.project-info_award-item'
        ], { clearProps: "transform,filter,opacity" });
        
        gsap.set(infoOverlay, { clearProps: "transform,filter" });
        
        isAnimating = false;
        
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { overlay: 'info' } 
          }));
        }
      });
    } else {
      // No animation fallback
      infoOverlay.classList.add('u-display-none');
      
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref);
      backLink.style.cursor = '';

      if (pausefx) pausefx.style.opacity = '0';
      if (video && !wasMutedBeforeOpen) {
        video.muted = false;
        video.removeAttribute('muted');
      }

      if (playerControls) playerControls.style.opacity = '1';
      if (navigationOverlay) navigationOverlay.style.opacity = '1';
      if (centerToggle) centerToggle.style.opacity = '1';
      
      isAnimating = false;
    }
  }

  // Click Info button to toggle
  const onInfoClick = (e) => {
    e.preventDefault();
    isOpen ? close() : open();
  };

  // Click Back/Close button to close when popup is open
  const onBackClick = (e) => {
    if (isOpen) {
      e.preventDefault();
      close();
    }
  };

  // ESC key to close
  const onKeyDown = (e) => {
    if (e.key === 'Escape' && isOpen) {
      close();
    }
  };

  // Click overlay background to close
  const onOverlayClick = (e) => {
    if (e.target === infoOverlay) {
      close();
    }
  };

  infoButton.addEventListener('click', onInfoClick);
  backLink.addEventListener('click', onBackClick);
  document.addEventListener('keydown', onKeyDown);
  infoOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    infoButton.removeEventListener('click', onInfoClick);
    backLink.removeEventListener('click', onBackClick);
    document.removeEventListener('keydown', onKeyDown);
    infoOverlay.removeEventListener('click', onOverlayClick);
  });

  return () => {
    if (revealTimeline) revealTimeline.kill();
    handlers.forEach(fn => fn());
    delete infoOverlay.dataset.scriptInitialized;
  };
}