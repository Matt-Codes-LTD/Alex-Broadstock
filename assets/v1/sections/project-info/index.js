// assets/v1/sections/project-info/index.js
import { createRevealAnimation } from "./animations.js";

export default function initProjectInfo(container) {
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const playerWrap = container.querySelector('.project-player_wrap');
  const infoOverlay = container.querySelector('.project-info_overlay');
  
  // Find the Info button specifically
  const navLinks = container.querySelectorAll('.nav_link');
  const infoButton = Array.from(navLinks).find(link => 
    link.textContent.trim() === 'Info'
  );
  
  if (!playerWrap || !infoOverlay || !infoButton) {
    console.warn('[ProjectInfo] Missing required elements');
    return () => {};
  }
  
  if (infoOverlay.dataset.scriptInitialized) return () => {};
  infoOverlay.dataset.scriptInitialized = "true";

  const video = playerWrap.querySelector('video');
  let isOpen = false;
  let revealTimeline = null;
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
    }
  }

  // Click Info button to toggle
  const onInfoClick = (e) => {
    e.preventDefault();
    isOpen ? close() : open();
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
  document.addEventListener('keydown', onKeyDown);
  infoOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    infoButton.removeEventListener('click', onInfoClick);
    document.removeEventListener('keydown', onKeyDown);
    infoOverlay.removeEventListener('click', onOverlayClick);
  });

  return () => {
    if (revealTimeline) revealTimeline.kill();
    handlers.forEach(fn => fn());
    delete infoOverlay.dataset.scriptInitialized;
  };
}