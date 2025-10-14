// assets/v1/sections/project-info/index.js
// FIXED: Handles overlay switching even during open animation
import { createRevealAnimation } from "./animations.js";

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
  let pendingOpen = false;
  const handlers = [];

  // FIXED: Listen for manager requesting us to close, even during animation
  const handleClosing = (e) => {
    if (e.detail.overlay === 'info' && isOpen) {
      // REMOVED !isAnimating check - now handles close even during open animation
      console.log('[ProjectInfo] Received close request from manager (isAnimating:', isAnimating, ')');
      
      // Kill any in-progress animations
      if (revealTimeline) {
        revealTimeline.kill();
        revealTimeline = null;
      }
      
      performClose(true, e.detail.keepBackdrop);
    }
  };
  
  // Listen for CLOSED event to know when safe to open
  const handleClosed = (e) => {
    if (pendingOpen && e.detail.keepBackdrop && e.detail.overlay !== 'info') {
      console.log('[ProjectInfo] Previous overlay closed, now opening');
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
    
    console.log('[ProjectInfo] Requesting to open');
    
    // Dispatch request to manager
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'info' } 
    }));
    
    // Smart detection - check if another overlay is currently open
    setTimeout(() => {
      if (!isOpen && !isAnimating) {
        // Check if any other overlay is visible
        const otherOverlays = [
          container.querySelector('.about-overlay'),
          container.querySelector('.bts-overlay')
        ].filter(Boolean);
        
        const isAnotherOverlayOpen = otherOverlays.some(overlay => 
          !overlay.classList.contains('u-display-none')
        );
        
        if (isAnotherOverlayOpen) {
          // Another overlay is open, wait for CLOSED event
          console.log('[ProjectInfo] Another overlay open, waiting for close');
          pendingOpen = true;
          
          // Safety timeout - if CLOSED event doesn't arrive in 1200ms, open anyway
          setTimeout(() => {
            if (pendingOpen && !isOpen && !isAnimating) {
              console.log('[ProjectInfo] CLOSED event timeout (1200ms), opening anyway');
              pendingOpen = false;
              performOpen();
            }
          }, 1200);
        } else {
          // No other overlay open, safe to open immediately
          console.log('[ProjectInfo] No other overlay, opening immediately');
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

    console.log('[ProjectInfo] Opening');

    // Store mute state and mute video (but keep playing)
    if (video) {
      wasMutedBeforeOpen = video.muted;
      video.muted = true;
      video.setAttribute('muted', '');
      
      if (video.paused) {
        video.play().catch(() => {});
      }
    }

    if (window.gsap) {
      // Set initial states BEFORE making overlay visible
      gsap.set(infoOverlay, { opacity: 0 });
      
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
      
      // Show the overlay container
      infoOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(infoOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      })
      
      // Animate content in
      .add(() => {
        runContentReveal();
      });
      
    } else {
      infoOverlay.classList.remove('u-display-none');
      runContentReveal();
    }

    // Update nav states
    navLinks.forEach(link => {
      if (link !== infoButton) {
        link.classList.add('u-color-faded');
      }
    });
    
    backLink.textContent = 'Close';
    backLink.removeAttribute('href');
    backLink.style.cursor = 'pointer';
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
          console.log('[ProjectInfo] Opened');
        });
      } else {
        isAnimating = false;
      }
    } else {
      isAnimating = false;
    }
  }

  function close() {
    if (!isOpen) return;
    
    // Kill any in-progress animations
    if (revealTimeline) {
      revealTimeline.kill();
      revealTimeline = null;
    }
    
    performClose(true, false);
  }

  function performClose(dispatchComplete, keepBackdrop = false) {
    if (!isOpen) return;
    
    isOpen = false;
    isAnimating = true;
    pendingOpen = false;

    console.log('[ProjectInfo] Closing, keepBackdrop:', keepBackdrop);

    if (window.gsap) {
      const closeTl = gsap.timeline();

      // Fast content exit
      closeTl.to([
        '.project-info_award-item',
        '.project-info_crew-name',
        '.project-info_crew-role',
        '.project-info_awards-label',
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
      
      // Gentle background fade
      .to(infoOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.1")
      
      // Cleanup
      .call(() => {
        infoOverlay.classList.add('u-display-none');
        
        // Restore nav states
        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });
        
        backLink.textContent = 'Back';
        backLink.setAttribute('href', originalBackHref);
        backLink.style.cursor = '';

        // Restore video mute state
        if (video) {
          video.muted = wasMutedBeforeOpen;
          if (wasMutedBeforeOpen) {
            video.setAttribute('muted', '');
          } else {
            video.removeAttribute('muted');
          }
        }

        isAnimating = false;

        // Notify manager we're closed
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { overlay: 'info', keepBackdrop } 
          }));
          console.log('[ProjectInfo] Closed complete, keepBackdrop:', keepBackdrop);
        }
      });
    } else {
      // No GSAP, close immediately
      infoOverlay.classList.add('u-display-none');
      
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });
      
      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref);
      backLink.style.cursor = '';

      if (video) {
        video.muted = wasMutedBeforeOpen;
      }

      isAnimating = false;

      if (dispatchComplete) {
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
          detail: { overlay: 'info', keepBackdrop } 
        }));
      }
    }
  }

  // Event handlers
  const onInfoClick = () => {
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
    if (e.target === infoOverlay) {
      close();
    }
  };

  // Event listeners
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
    pendingOpen = false;
    handlers.forEach(fn => fn());
    delete infoOverlay.dataset.scriptInitialized;
  };
}