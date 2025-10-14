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

  // Listen for manager requesting us to close
  const handleClosing = (e) => {
    if (e.detail.overlay === 'info' && isOpen && !isAnimating) {
      console.log('[ProjectInfo] Received close request from manager');
      performClose(true);
    }
  };
  
  window.addEventListener(OVERLAY_EVENTS.CLOSING, handleClosing);
  handlers.push(() => window.removeEventListener(OVERLAY_EVENTS.CLOSING, handleClosing));

  function open() {
    if (isOpen || isAnimating) return;
    
    console.log('[ProjectInfo] Requesting to open');
    
    // Request to open
    window.dispatchEvent(new CustomEvent(OVERLAY_EVENTS.REQUEST_OPEN, { 
      detail: { overlay: 'info' } 
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
        console.log('[ProjectInfo] Manager timeout, opening anyway');
        performOpen();
      }
    }, 100);
  }

  function performOpen() {
    if (isOpen || isAnimating) return;
    isOpen = true;
    isAnimating = true;

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
    if (!isOpen || isAnimating) return;
    performClose(true);
  }

  function performClose(dispatchComplete) {
    isOpen = false;
    isAnimating = true;

    console.log('[ProjectInfo] Closing');

    if (window.gsap && revealTimeline) {
      const closeTl = gsap.timeline();
      
      // Fast content exit
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
      
      // Gentle background fade
      .to(infoOverlay, {
        opacity: 0,
        duration: 0.7,
        ease: "sine.out"
      }, "-=0.1")
      
      // Cleanup
      .call(() => {
        infoOverlay.classList.add('u-display-none');
        
        navLinks.forEach(link => {
          link.classList.remove('u-color-faded');
        });

        backLink.textContent = 'Back';
        backLink.setAttribute('href', originalBackHref);
        backLink.style.cursor = '';

        if (video && !wasMutedBeforeOpen) {
          video.muted = false;
          video.removeAttribute('muted');
        }

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
          console.log('[ProjectInfo] Closed');
        }
      });
    } else {
      // Fallback without GSAP
      infoOverlay.classList.add('u-display-none');
      
      navLinks.forEach(link => {
        link.classList.remove('u-color-faded');
      });

      backLink.textContent = 'Back';
      backLink.setAttribute('href', originalBackHref);
      backLink.style.cursor = '';

      if (video && !wasMutedBeforeOpen) {
        video.muted = false;
        video.removeAttribute('muted');
      }
      
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