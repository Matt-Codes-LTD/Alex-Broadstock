// assets/v1/sections/about-overlay/index.js
// UPDATED: Video no longer mutes, fixed close link navigation, added backdrop click to close
import { createRevealAnimation } from "./animations.js";

const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

export default function initAboutOverlay(container) {
  const navWrap = container.querySelector('.nav_wrap');
  if (!navWrap) return () => {};
  
  const aboutOverlay = container.querySelector('.about-overlay');
  if (!aboutOverlay) {
    console.warn('[AboutOverlay] No overlay element found');
    return () => {};
  }
  
  // Find the About button (required)
  const navLinks = container.querySelectorAll('.nav_link');
  const aboutButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'About'
  );
  
  if (!aboutButton) {
    console.warn('[AboutOverlay] About button not found');
    return () => {};
  }
  
  // Store original About text
  const originalAboutText = aboutButton.textContent;
  
  // Find Back link (optional - only on project pages)
  const backLink = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Back'
  );
  
  // Check if we're on home or project page
  const isHomePage = container.dataset.barbaNamespace === "home";
  const isProjectPage = container.dataset.barbaNamespace === "project";
  
  if (aboutOverlay.dataset.scriptInitialized) return () => {};
  aboutOverlay.dataset.scriptInitialized = "true";

  // Find video element (only on project page)
  const video = container.querySelector('video');
  
  let isOpen = false;
  let isAnimating = false;
  let revealTimeline = null;
  let originalBackHref = backLink?.getAttribute('href');
  let pendingOpen = false;
  const handlers = [];

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'about' && isOpen) {
      console.log('[AboutOverlay] Received close request from manager (isAnimating:', isAnimating, ')');
      
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
    if (pendingOpen && e.detail.keepBackdrop && e.detail.overlay !== 'about') {
      console.log('[AboutOverlay] Previous overlay closed, now opening');
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
    
    console.log('[AboutOverlay] Requesting to open');
    
    // Dispatch request to manager
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'about' } 
    }));
    
    // Smart detection - check if another overlay is currently open
    setTimeout(() => {
      if (!isOpen && !isAnimating) {
        // Check if any other overlay is visible
        const otherOverlays = [
          container.querySelector('.project-info_overlay'),
          container.querySelector('.bts-overlay')
        ].filter(Boolean);
        
        const isAnotherOverlayOpen = otherOverlays.some(overlay => 
          !overlay.classList.contains('u-display-none')
        );
        
        if (isAnotherOverlayOpen) {
          // Another overlay is open, wait for CLOSED event
          console.log('[AboutOverlay] Another overlay open, waiting for close');
          pendingOpen = true;
          
          // FASTER timeout - was 1200ms
          setTimeout(() => {
            if (pendingOpen && !isOpen && !isAnimating) {
              console.log('[AboutOverlay] CLOSED event timeout (600ms), opening anyway');
              pendingOpen = false;
              performOpen();
            }
          }, 600);
        } else {
          // No other overlay open, safe to open immediately
          console.log('[AboutOverlay] No other overlay, opening immediately');
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

    console.log('[AboutOverlay] Opening');

    // Keep video playing without muting
    if (video && isProjectPage && video.paused) {
      video.play().catch(() => {});
    }

    if (window.gsap) {
      const elements = [
        '.about-bio-label',
        '.about-bio-content',
        '.about-contact-label',
        '.about-contact-link',
        '.about-work-label',
        '.about-work-link',
        '.about-awards-label',
        '.about-award-item'
      ];

      // CRITICAL: Force disable CSS transitions BEFORE animation
      gsap.set(elements, {
        transition: 'none !important'
      });

      // Set initial states BEFORE making overlay visible
      gsap.set(aboutOverlay, { 
        opacity: 0,
        willChange: 'opacity'
      });
      
      gsap.set(elements, {
        opacity: 0,
        willChange: 'opacity'
      });
      
      // Show the overlay container (transparent)
      aboutOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline - SIMPLE & FAST
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(aboutOverlay, {
        opacity: 1,
        duration: 0.2, // Fast
        ease: "power2.out",
        onComplete: () => {
          gsap.set(aboutOverlay, { willChange: 'auto' });
        }
      })
      
      // Animate content in
      .add(() => {
        runContentReveal();
      });
      
    } else {
      aboutOverlay.classList.remove('u-display-none');
      runContentReveal();
    }

    // Update nav states
    if (isHomePage) {
      aboutButton.textContent = 'Close';
      aboutButton.setAttribute('data-overlay-open', 'true');
    } else if (isProjectPage && backLink) {
      backLink.textContent = 'Close';
      backLink.removeAttribute('href');
      backLink.style.cursor = 'pointer';
    }

    // Fade other nav links (not on home page where we change button text)
    if (isProjectPage) {
      navLinks.forEach(link => {
        if (link !== backLink) {
          link.classList.add('u-color-faded');
        }
      });
    }
  }

  function runContentReveal() {
    revealTimeline = createRevealAnimation(container);
    
    if (revealTimeline) {
      revealTimeline.eventCallback('onComplete', () => {
        isAnimating = false;
        revealTimeline = null;
        
        // Dispatch OPENED event
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
          detail: { overlay: 'about' } 
        }));
        console.log('[AboutOverlay] Opened');
      });
    } else {
      isAnimating = false;
      window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
        detail: { overlay: 'about' } 
      }));
      console.log('[AboutOverlay] Opened (no GSAP)');
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

    console.log('[AboutOverlay] Closing, keepBackdrop:', keepBackdrop);

    // Kill any in-progress reveal
    if (revealTimeline) {
      revealTimeline.kill();
      revealTimeline = null;
    }

    if (window.gsap) {
      const elements = [
        '.about-bio-label',
        '.about-bio-content',
        '.about-contact-label',
        '.about-contact-link',
        '.about-work-label',
        '.about-work-link',
        '.about-awards-label',
        '.about-award-item'
      ];

      // VERY FAST close - no separate content fade
      gsap.to([aboutOverlay, ...elements], {
        opacity: 0,
        duration: 0.15, // SUPER FAST for switching
        ease: "power2.in",
        onComplete: () => {
          aboutOverlay.classList.add('u-display-none');
          isAnimating = false;
          
          // Re-enable CSS transitions
          gsap.set(elements, {
            clearProps: 'transition'
          });
          
          // Wait a moment before restoring nav state to prevent accidental navigation
          setTimeout(() => {
            // Reset nav states
            if (isHomePage) {
              aboutButton.textContent = originalAboutText;
              aboutButton.removeAttribute('data-overlay-open');
            } else if (isProjectPage && backLink) {
              backLink.textContent = 'Back';
              backLink.setAttribute('href', originalBackHref || '/');
              backLink.style.cursor = '';
            }

            // Restore nav link colors
            if (isProjectPage) {
              navLinks.forEach(link => {
                link.classList.remove('u-color-faded');
              });
            }
          }, 100); // Small delay to prevent accidental clicks
          
          if (dispatchComplete) {
            window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
              detail: { overlay: 'about', keepBackdrop } 
            }));
            console.log('[AboutOverlay] Closed');
          }
        }
      });
      
    } else {
      aboutOverlay.classList.add('u-display-none');
      isAnimating = false;
      
      // Wait a moment before restoring nav state
      setTimeout(() => {
        if (isHomePage) {
          aboutButton.textContent = originalAboutText;
          aboutButton.removeAttribute('data-overlay-open');
        } else if (isProjectPage && backLink) {
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref || '/');
          backLink.style.cursor = '';
        }

        if (isProjectPage) {
          navLinks.forEach(link => {
            link.classList.remove('u-color-faded');
          });
        }
      }, 100);
      
      if (dispatchComplete) {
        window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
          detail: { overlay: 'about', keepBackdrop } 
        }));
        console.log('[AboutOverlay] Closed (no GSAP)');
      }
    }
  }

  // Event listeners
  aboutButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (isOpen) {
      close();
    } else {
      open();
    }
  });

  // Back link as close on project page
  if (backLink && isProjectPage) {
    const handleBackClick = (e) => {
      if (isOpen) {
        e.preventDefault();
        close();
      }
    };
    backLink.addEventListener('click', handleBackClick);
    handlers.push(() => backLink.removeEventListener('click', handleBackClick));
  }

  // Click backdrop to close
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the overlay wrapper, not on child elements
    if (isOpen && e.target === aboutOverlay) {
      e.preventDefault();
      close();
    }
  };
  aboutOverlay.addEventListener('click', handleBackdropClick);
  handlers.push(() => aboutOverlay.removeEventListener('click', handleBackdropClick));

  // Cleanup
  return () => {
    handlers.forEach(fn => fn());
    if (revealTimeline) {
      revealTimeline.kill();
    }
    delete aboutOverlay.dataset.scriptInitialized;
  };
}