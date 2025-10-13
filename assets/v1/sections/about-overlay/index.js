// assets/v1/sections/about-overlay/index.js
import { createRevealAnimation } from "./animations.js";

// Overlay coordination events
const OVERLAY_EVENTS = {
  REQUEST_OPEN: 'overlay:request-open',
  CLOSING: 'overlay:closing',
  OPENED: 'overlay:opened',
  CLOSED: 'overlay:closed'
};

export default function initAboutOverlay(container) {
  // Only run on pages with navigation
  const navWrap = container.querySelector('.nav_wrap');
  if (!navWrap) return () => {};
  
  const aboutOverlay = container.querySelector('.about-overlay');
  if (!aboutOverlay) {
    console.warn('[AboutOverlay] No overlay element found');
    return () => {};
  }
  
  // Find the About button and Back link in nav
  const navLinks = container.querySelectorAll('.nav_link');
  const aboutButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'About'
  );
  const backLink = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Back'
  );
  
  // Find player elements to hide (if on project page)
  const playerControls = container.querySelector('.project-player_controls');
  const navigationOverlay = container.querySelector('.project-navigation_overlay');
  const centerToggle = container.querySelector('.project-player_center-toggle');
  const pausefx = container.querySelector('.project-player_pausefx');
  
  if (!aboutButton || !backLink) {
    console.warn('[AboutOverlay] Missing nav elements');
    return () => {};
  }
  
  if (aboutOverlay.dataset.scriptInitialized) return () => {};
  aboutOverlay.dataset.scriptInitialized = "true";

  const playerWrap = container.querySelector('.project-player_wrap');
  const video = playerWrap?.querySelector('video');
  let isOpen = false;
  let isAnimating = false;
  let revealTimeline = null;
  let originalBackHref = backLink.getAttribute('href');
  let wasPlayingBeforeOpen = false;
  const handlers = [];

  // Listen for other overlays requesting to open
  const handleOverlayRequest = (e) => {
    if (e.detail.overlay !== 'about' && isOpen && !isAnimating) {
      // Another overlay wants to open, close this one smoothly
      closeForTransition();
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest));

  function open() {
    if (isOpen || isAnimating) return;
    
    // Request to open (will trigger close on other overlays)
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'about' } 
    }));
    
    // Listen for when another overlay starts closing
    let waitingForOther = false;
    const onOtherClosing = () => {
      waitingForOther = true;
      // Start opening with cross-fade
      performOpen(true);
    };
    
    window.addEventListener(OVERLAY_EVENTS.CLOSING, onOtherClosing, { once: true });
    
    // If no other overlay responds within 100ms, just open normally
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

    // Add class to nav for color change
    navWrap.classList.add('has-overlay-open');

    // Store video state and pause
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    // Show pausefx if on project page
    if (pausefx) {
      if (window.gsap) {
        gsap.to(pausefx, { opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        pausefx.style.opacity = '1';
      }
    }

    // Show overlay
    aboutOverlay.classList.remove('u-display-none');
    
    if (isCrossFade && window.gsap) {
      // Cross-fade: start with opacity 0 and fade in
      gsap.set(aboutOverlay, { opacity: 0 });
      gsap.to(aboutOverlay, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
        onComplete: () => {
          // Then run content reveal
          runContentReveal();
        }
      });
    } else {
      // Normal open
      runContentReveal();
    }

    // Update nav states - fade all except About
    navLinks.forEach(link => {
      if (link !== aboutButton) {
        link.classList.add('u-color-faded');
      }
    });

    // Change Back to Close
    backLink.textContent = 'Close';
    backLink.removeAttribute('href');
    backLink.style.cursor = 'pointer';

    // Hide player controls if on project page
    if (window.gsap) {
      if (playerControls || navigationOverlay || centerToggle) {
        gsap.to([playerControls, navigationOverlay, centerToggle].filter(Boolean), {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    } else {
      if (playerControls) playerControls.style.opacity = '0';
      if (navigationOverlay) navigationOverlay.style.opacity = '0';
      if (centerToggle) centerToggle.style.opacity = '0';
    }
  }

  function runContentReveal() {
    if (window.gsap) {
      revealTimeline = createRevealAnimation(aboutOverlay);
      if (revealTimeline) {
        revealTimeline.eventCallback('onComplete', () => {
          isAnimating = false;
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.OPENED, { 
            detail: { overlay: 'about' } 
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
      detail: { overlay: 'about' } 
    }));
    
    performClose(false);
  }

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    // Remove class from nav
    navWrap.classList.remove('has-overlay-open');

    if (window.gsap && revealTimeline) {
      // Create a timeline for smoother closing
      const closeTl = gsap.timeline({
        onComplete: () => {
          aboutOverlay.classList.add('u-display-none');
          
          // Restore nav states
          navLinks.forEach(link => {
            link.classList.remove('u-color-faded');
          });

          // Restore Back link
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref);
          backLink.style.cursor = '';

          // Hide pausefx if on project page
          if (pausefx) {
            gsap.to(pausefx, { opacity: 0, duration: 0.3, ease: "power2.out" });
          }

          // Resume video if it was playing
          if (video && wasPlayingBeforeOpen) {
            video.play().catch(() => {});
          }

          // Show player controls again if on project page
          if (playerControls || navigationOverlay || centerToggle) {
            gsap.to([playerControls, navigationOverlay, centerToggle].filter(Boolean), {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          }

          // Clear props
          gsap.set([
            '.about-bio-label',
            '.about-bio-content',
            '.about-contact-label',
            '.about-contact-link',
            '.about-work-label',
            '.about-work-link',
            '.about-awards-label',
            '.about-award-item'
          ], { clearProps: "all" });
          
          gsap.set(aboutOverlay, { clearProps: "all" });
          
          isAnimating = false;
          
          if (dispatchComplete) {
            window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
              detail: { overlay: 'about' } 
            }));
          }
        }
      });

      // Smoother content fade out - faster but gentler
      closeTl.to([
        '.about-award-item',
        '.about-work-link',
        '.about-contact-link',
        '.about-bio-content',
        '.about-awards-label',
        '.about-work-label',
        '.about-contact-label',
        '.about-bio-label'
      ], {
        opacity: 0,
        y: -10, // Reduced from -15
        filter: "blur(10px)", // Increased blur for softer transition
        duration: 0.25, // Slightly faster content fade
        stagger: 0.015, // Tighter stagger
        ease: "power2.in"
      })
      
      // Then fade the entire overlay more smoothly
      .to(aboutOverlay, {
        opacity: 0,
        scale: 0.98, // Subtle scale down for gentler exit
        duration: 0.6, // Longer fade for smoother transition
        ease: "power3.inOut" // Smoother easing curve
      }, "-=0.1"); // Slight overlap with content fade

    } else {
      aboutOverlay.classList.add('u-display-none');
      
      // Restore everything without animation
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref);
      backLink.style.cursor = '';

      if (pausefx) pausefx.style.opacity = '0';
      if (video && wasPlayingBeforeOpen) video.play().catch(() => {});
      if (playerControls) playerControls.style.opacity = '1';
      if (navigationOverlay) navigationOverlay.style.opacity = '1';
      if (centerToggle) centerToggle.style.opacity = '1';
      
      isAnimating = false;
    }
  }

  // Event handlers
  const onAboutClick = (e) => {
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
    if (e.target === aboutOverlay) {
      close();
    }
  };

  aboutButton.addEventListener('click', onAboutClick);
  backLink.addEventListener('click', onBackClick);
  document.addEventListener('keydown', onKeyDown);
  aboutOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    aboutButton.removeEventListener('click', onAboutClick);
    backLink.removeEventListener('click', onBackClick);
    document.removeEventListener('keydown', onKeyDown);
    aboutOverlay.removeEventListener('click', onOverlayClick);
  });

  return () => {
    if (revealTimeline) revealTimeline.kill();
    handlers.forEach(fn => fn());
    delete aboutOverlay.dataset.scriptInitialized;
  };
}