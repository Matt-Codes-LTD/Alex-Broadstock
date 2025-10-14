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
  const video = container.querySelector('video');
  
  let isOpen = false;
  let isAnimating = false;
  let revealTimeline = null;
  let originalBackHref = backLink?.getAttribute('href');
  const handlers = [];

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'about' && isOpen && !isAnimating) {
      console.log('[AboutOverlay] Received close request from manager');
      performClose(true);
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.CLOSING, handleClosing);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.CLOSING, handleClosing));

  function open() {
    if (isOpen || isAnimating) return;
    
    console.log('[AboutOverlay] Requesting to open');
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'about' } 
    }));
    
    // Wait for manager to give us the go-ahead
    let waitingForManager = false;
    const onManagerReady = () => {
      waitingForManager = true;
      performOpen();
    };
    
    // Manager will close any open overlay, then we can open
    // If no overlay is open, this will fire immediately
    window.addEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onManagerReady, { once: true });
    
    // Timeout - if manager doesn't respond, just open
    setTimeout(() => {
      window.removeEventListener(OVERLAY_EVENTS.REQUEST_OPEN, onManagerReady);
      if (!waitingForManager && !isOpen && !isAnimating) {
        console.log('[AboutOverlay] Manager timeout, opening anyway');
        performOpen();
      }
    }, 100);
  }

  function performOpen() {
    if (isOpen || isAnimating) return;
    isOpen = true;
    isAnimating = true;

    console.log('[AboutOverlay] Opening');

    if (window.gsap) {
      // Set initial states BEFORE making overlay visible
      gsap.set(aboutOverlay, { opacity: 0 });
      
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
      
      // Show the overlay container (transparent)
      aboutOverlay.classList.remove('u-display-none');
      
      // Create entrance timeline
      const entranceTl = gsap.timeline();
      
      // Fade background in
      entranceTl.to(aboutOverlay, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
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
    } else if (isProjectPage) {
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
          console.log('[AboutOverlay] Opened');
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

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    console.log('[AboutOverlay] Closing');

    if (window.gsap && revealTimeline) {
      const closeTl = gsap.timeline();

      // Fast content exit
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
      
      // Gentle background fade
      .to(aboutOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.1")
      
      // Cleanup
      .call(() => {
        aboutOverlay.classList.add('u-display-none');
        
        // Restore nav states
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
        ], { clearProps: "transform,filter,opacity" });
        
        gsap.set(aboutOverlay, { clearProps: "transform,filter" });
        
        isAnimating = false;
        
        if (dispatchComplete) {
          window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.CLOSED, { 
            detail: { overlay: 'about' } 
          }));
          console.log('[AboutOverlay] Closed');
        }
      });

    } else {
      // Fallback without GSAP
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