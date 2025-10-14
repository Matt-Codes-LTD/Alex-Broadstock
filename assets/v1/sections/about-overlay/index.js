// assets/v1/sections/about-overlay/index.js
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

  // Find player elements (only on project page)
  const playerWrap = container.querySelector('.project-player_wrap');
  const video = playerWrap?.querySelector('video');
  const playerControls = container.querySelector('.project-player_controls');
  const navigationOverlay = container.querySelector('.project-navigation_overlay');
  const centerToggle = container.querySelector('.project-player_center-toggle');
  const pausefx = container.querySelector('.project-player_pausefx');
  
  let isOpen = false;
  let isAnimating = false;
  let revealTimeline = null;
  let originalBackHref = backLink?.getAttribute('href');
  let wasPlayingBeforeOpen = false;
  const handlers = [];

  // Listen for other overlays requesting to open
  const handleOverlayRequest = (e) => {
    if (e.detail.overlay !== 'about' && isOpen && !isAnimating) {
      closeForTransition();
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, handleOverlayRequest));

  function open() {
    if (isOpen || isAnimating) return;
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'about' } 
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

    // Handle video on project pages
    if (video) {
      wasPlayingBeforeOpen = !video.paused;
      if (wasPlayingBeforeOpen) {
        video.pause();
      }
    }

    // Show pausefx on project pages
    if (pausefx) {
      if (window.gsap) {
        gsap.to(pausefx, { opacity: 1, duration: 0.3, ease: "power2.out" });
      } else {
        pausefx.style.opacity = '1';
      }
    }

    if (window.gsap) {
      // CRITICAL: Set initial states BEFORE making overlay visible
      // Hide overlay background
      gsap.set(aboutOverlay, { opacity: 0 });
      
      // Hide all content elements
      gsap.set([
        '.about-bio-label',
        '.about-bio-content',
        '.about-contact-label',
        '.about-contact-link',
        '.about-work-label',
        '.about-work-link',
        '.about-awards-label',
        '.about-award-item'
      ], {
        opacity: 0,
        y: 12,
        filter: "blur(6px)"
      });
      
      // NOW show the overlay container (but it's transparent)
      aboutOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Step 1: Fade background in
      entranceTl.to(aboutOverlay, {
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
      aboutOverlay.classList.remove('u-display-none');
      runContentReveal();
    }

    // Update nav states - handle both home and project pages
    if (isHomePage) {
      // On home page, change About to Close
      aboutButton.textContent = 'Close';
      aboutButton.setAttribute('data-overlay-open', 'true');
    } else if (isProjectPage) {
      // On project page, fade other links and change Back to Close
      navLinks.forEach(link => {
        if (link !== aboutButton) {
          link.classList.add('u-color-faded');
        }
      });
      
      if (backLink) {
        backLink.textContent = 'Close';
        backLink.removeAttribute('href');
        backLink.style.cursor = 'pointer';
      }
    }

    // Hide player controls on project pages
    if (isProjectPage && window.gsap) {
      if (playerControls || navigationOverlay || centerToggle) {
        gsap.to([playerControls, navigationOverlay, centerToggle].filter(Boolean), {
          opacity: 0,
          duration: 0.3,
          ease: "power2.out"
        });
      }
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
    
    // Close and ALWAYS dispatch CLOSED when done
    performClose(true);
  }

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    if (window.gsap && revealTimeline) {
      const closeTl = gsap.timeline();

      // Step 1: FAST content exit - MATCHED TO INFO OVERLAY
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
        y: -8,
        filter: "blur(4px)",
        duration: 0.22,
        stagger: 0.015,
        ease: "power3.in"
      })
      
      // Step 2: GENTLE background fade (smooth) - ALREADY MATCHES
      .to(aboutOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.1")
      
      // Step 3: Cleanup
      .call(() => {
        aboutOverlay.classList.add('u-display-none');
        
        // Restore nav states based on page type
        if (isHomePage) {
          aboutButton.textContent = originalAboutText;
          aboutButton.removeAttribute('data-overlay-open');
        } else if (isProjectPage) {
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
        }

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
      });

    } else {
      // No animation fallback
      aboutOverlay.classList.add('u-display-none');
      
      if (isHomePage) {
        aboutButton.textContent = originalAboutText;
        aboutButton.removeAttribute('data-overlay-open');
      } else if (isProjectPage) {
        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });

        if (backLink) {
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref);
          backLink.style.cursor = '';
        }
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
  const onAboutClick = (e) => {
    e.preventDefault();
    isOpen ? close() : open();
  };

  const onBackClick = (e) => {
    if (isOpen && isProjectPage) {
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
  
  // Close overlay when category is clicked (home page only)
  const onCategoryClick = (e) => {
    if (isHomePage && isOpen) {
      const categoryBtn = e.target.closest('.home-category_text');
      if (categoryBtn) {
        setTimeout(() => close(), 100);
      }
    }
  };

  // Event listeners
  aboutButton.addEventListener('click', onAboutClick);
  if (backLink) backLink.addEventListener('click', onBackClick);
  document.addEventListener('keydown', onKeyDown);
  aboutOverlay.addEventListener('click', onOverlayClick);
  
  if (isHomePage) {
    const categoriesContainer = container.querySelector('.home_hero_categories');
    if (categoriesContainer) {
      categoriesContainer.addEventListener('click', onCategoryClick);
      handlers.push(() => categoriesContainer.removeEventListener('click', onCategoryClick));
    }
  }

  handlers.push(() => {
    aboutButton.removeEventListener('click', onAboutClick);
    if (backLink) backLink.removeEventListener('click', onBackClick);
    document.removeEventListener('keydown', onKeyDown);
    aboutOverlay.removeEventListener('click', onOverlayClick);
  });

  return () => {
    if (revealTimeline) revealTimeline.kill();
    handlers.forEach(fn => fn());
    delete aboutOverlay.dataset.scriptInitialized;
  };
}