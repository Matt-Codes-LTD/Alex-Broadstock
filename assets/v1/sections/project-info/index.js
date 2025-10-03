// assets/v1/sections/project-info/index.js
import { createRevealAnimation } from "./animations.js";

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
  
  if (!playerWrap || !infoOverlay || !infoButton || !backLink) {
    console.warn('[ProjectInfo] Missing required elements');
    return () => {};
  }
  
  if (infoOverlay.dataset.scriptInitialized) return () => {};
  infoOverlay.dataset.scriptInitialized = "true";

  const video = playerWrap.querySelector('video');
  let isOpen = false;
  let revealTimeline = null;
  let originalBackHref = backLink.getAttribute('href');
  const handlers = [];

  function open() {
    if (isOpen) return;
    isOpen = true;

    // Pause video
    if (video && !video.paused) {
      video.pause();
    }

    // Show overlay
    infoOverlay.classList.remove('u-display-none');

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

    // Run reveal animation
    if (window.gsap) {
      revealTimeline = createRevealAnimation(infoOverlay);
    }
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    if (window.gsap && revealTimeline) {
      gsap.to([
        '.project-info_award-item',
        '.project-info_awards-label',
        '.project-info_crew-name',
        '.project-info_crew-role',
        '.project-info_crew-label',
        '.project-info_description'
      ], {
        opacity: 0,
        y: -15,
        filter: "blur(6px)",
        duration: 0.4,
        stagger: 0.03,
        ease: "power2.inOut",
        onComplete: () => {
          infoOverlay.classList.add('u-display-none');
          
          // Restore nav states
          navLinks.forEach(link => {
            link.classList.remove('u-color-faded');
          });

          // Restore Back link
          backLink.textContent = 'Back';
          backLink.setAttribute('href', originalBackHref);
          backLink.style.cursor = '';

          // Show player controls again
          if (window.gsap) {
            gsap.to([playerControls, navigationOverlay, centerToggle], {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            if (playerControls) playerControls.style.opacity = '1';
            if (navigationOverlay) navigationOverlay.style.opacity = '1';
            if (centerToggle) centerToggle.style.opacity = '1';
          }

          gsap.set([
            '.project-info_description',
            '.project-info_crew-label',
            '.project-info_crew-role',
            '.project-info_crew-name',
            '.project-info_awards-label',
            '.project-info_award-item'
          ], { clearProps: "all" });
        }
      });
    } else {
      infoOverlay.classList.add('u-display-none');
      
      // Restore nav states
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

      // Restore Back link
      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref);
      backLink.style.cursor = '';

      // Show player controls again
      if (playerControls) playerControls.style.opacity = '1';
      if (navigationOverlay) navigationOverlay.style.opacity = '1';
      if (centerToggle) centerToggle.style.opacity = '1';
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