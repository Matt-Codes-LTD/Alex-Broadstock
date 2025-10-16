// assets/v1/sections/project-info/index.js
// UPDATED: Video no longer mutes, fixed close link navigation, added backdrop click to close
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
  let pendingOpen = false;
  const handlers = [];

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'info' && isOpen) {
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
          
          // FASTER timeout - was 1200ms
          setTimeout(() => {
            if (pendingOpen && !isOpen && !isAnimating) {
              console.log('[ProjectInfo] CLOSED event timeout (600ms), opening anyway');
              pendingOpen = false;
              performOpen();
            }
          }, 600);
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

    // Keep video playing without muting
    if (video && video.paused) {
      video.play().catch(() => {});
    }

    if (window.gsap) {
      const elements = [
        '.project-info_description',
        '.project-info_crew-label',
        '.project-info_crew-role',
        '.project-info_crew-name',
        '.project-info_awards-label',
        '.project-info_award-item'
      ];

      // Set initial states BEFORE making overlay visible
      gsap.set(infoOverlay, { 
        opacity: 0,
        willChange: 'opacity'
      });
      
      gsap.set(elements, {
        opacity: 0,
        willChange: 'opacity'
      });
      
      // Show the overlay container
      infoOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline - SIMPLE & FAST
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(infoOverlay, {
        opacity: 1,
        duration: 0.2, // Fast
        ease: "power2.out",
        onComplete: () => {
          gsap.set(infoOverlay, { willChange: 'auto' });
        }
      })
      
      // Animate content in
      .add(() => {
        runContentReveal();
      });
      
    } else {
      infoOverlay.classList.remove('u-display-none');
      runContentReveal();
    }

    // Fade other nav links
    navLinks.forEach(link => {
      if (link !== infoButton) {
        link.classList.add('u-color-faded');
      }
    });

    // Change Back to Close
    backLink.textContent = 'Close';
    backLink.removeAttribute('href');
    backLink.style.cursor = 'pointer';
  }

  function runContentReveal() {
    revealTimeline = createRevealAnimation(container);
    
    if (revealTimeline) {
      revealTimeline.eventCallback('onComplete', () => {
        isAnimating = false;
        revealTimeline = null;
        
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
          detail: { overlay: 'info' } 
        }));
        console.log('[ProjectInfo] Opened');
      });
    } else {
      isAnimating = false;
      window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
        detail: { overlay: 'info' } 
      }));
      console.log('[ProjectInfo] Opened (no GSAP)');
    }
  }

  function close() {
    performClose(true, false);
  }

  function performClose(dispatchComplete, keepBackdrop = false) {
    if (!isOpen) return;
    
    isOpen = false;
    isAnimating = true;
    pendingOpen = false;

    console.log('[ProjectInfo] Closing, keepBackdrop:', keepBackdrop);

    // Kill any in-progress reveal
    if (revealTimeline) {
      revealTimeline.kill();
      revealTimeline = null;
    }

    if (window.gsap) {
      const elements = [
        '.project-info_description',
        '.project-info_crew-label',
        '.project-info_crew-role',
        '.project-info_crew-name',
        '.project-info_awards-label',
        '.project-info_award-item'
      ];

      // VERY FAST close - no separate content fade
      gsap.to([infoOverlay, ...elements], {
        opacity: 0,
        duration: 0.15, // SUPER FAST for switching
        ease: "power2.in",
        onComplete: () => {
          infoOverlay.classList.add('u-display-none');
          isAnimating = false;
          
          // Wait a moment before restoring nav state to prevent accidental navigation
          setTimeout(() => {
            // Reset Back link
            backLink.textContent = 'Back';
            backLink.setAttribute('href', originalBackHref);
            backLink.style.cursor = '';

            // Restore nav link colors
            navLinks.forEach(link => {
              link.classList.remove('u-color-faded');
            });
          }, 100); // Small delay to prevent accidental clicks
          
          if (dispatchComplete) {
            window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
              detail: { overlay: 'info', keepBackdrop } 
            }));
            console.log('[ProjectInfo] Closed');
          }
        }
      });
      
    } else {
      infoOverlay.classList.add('u-display-none');
      isAnimating = false;
      
      // Wait a moment before restoring nav state
      setTimeout(() => {
        backLink.textContent = 'Back';
        backLink.setAttribute('href', originalBackHref);
        backLink.style.cursor = '';

        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });
      }, 100);
      
      if (dispatchComplete) {
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
          detail: { overlay: 'info', keepBackdrop } 
        }));
        console.log('[ProjectInfo] Closed (no GSAP)');
      }
    }
  }

  // Event listeners
  infoButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  // Back link as close
  const handleBackClick = (e) => {
    if (isOpen) {
      e.preventDefault();
      close();
    }
  };
  backLink.addEventListener('click', handleBackClick);
  handlers.push(() => backLink.removeEventListener('click', handleBackClick));

  // Click backdrop to close
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the overlay wrapper, not on child elements
    if (isOpen && e.target === infoOverlay) {
      e.preventDefault();
      close();
    }
  };
  infoOverlay.addEventListener('click', handleBackdropClick);
  handlers.push(() => infoOverlay.removeEventListener('click', handleBackdropClick));

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
    if (revealTimeline) {
      revealTimeline.kill();
    }
    delete infoOverlay.dataset.scriptInitialized;
  };
}