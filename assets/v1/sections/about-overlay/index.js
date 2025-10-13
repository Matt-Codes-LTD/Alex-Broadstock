// assets/v1/sections/about-overlay/index.js
import { createRevealAnimation } from "./animations.js";

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
  let revealTimeline = null;
  let originalBackHref = backLink.getAttribute('href');
  let wasPlayingBeforeOpen = false;
  const handlers = [];

  function open() {
    if (isOpen) return;
    isOpen = true;

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

    // Run reveal animation
    if (window.gsap) {
      revealTimeline = createRevealAnimation(aboutOverlay);
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    // Remove class from nav
    navWrap.classList.remove('has-overlay-open');

    if (window.gsap && revealTimeline) {
      // Reverse animation
      gsap.to([
        '.about-awards-item',
        '.about-work-link',
        '.about-contact-link',
        '.about-bio-content',
        '.about-awards-label',
        '.about-work-label',
        '.about-contact-label',
        '.about-bio-label'
      ], {
        opacity: 0,
        y: -15,
        filter: "blur(6px)",
        duration: 0.3,
        stagger: 0.02,
        ease: "power2.inOut",
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
            '.about-awards-item'
          ], { clearProps: "all" });
        }
      });
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