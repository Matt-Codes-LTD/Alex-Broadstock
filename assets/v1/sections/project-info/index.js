// assets/v1/sections/project-info/index.js
import { createRevealAnimation } from "./animations.js";

export default function initProjectInfo(container) {
  // Only run on project pages
  if (container.dataset.barbaNamespace !== "project") return () => {};
  
  const playerWrap = container.querySelector('.project-player_wrap');
  const infoOverlay = container.querySelector('.project-info_overlay');
  const infoButton = container.querySelector('.nav_link[href="/"]'); // Adjust selector if needed
  
  if (!playerWrap || !infoOverlay) return () => {};
  if (infoOverlay.dataset.scriptInitialized) return () => {};
  infoOverlay.dataset.scriptInitialized = "true";

  const video = playerWrap.querySelector('video');
  let isOpen = false;
  let revealTimeline = null;
  const handlers = [];

  function open() {
    if (isOpen) return;
    isOpen = true;

    // Pause video (triggers is-paused class and pausefx overlay)
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

    // Animate out
    if (window.gsap && revealTimeline) {
      gsap.to([
        '.project-info_description',
        '.project-info_crew-label',
        '.project-info_crew-role',
        '.project-info_crew-name',
        '.project-info_awards-label',
        '.project-info_award-item'
      ], {
        opacity: 0,
        y: -10,
        duration: 0.3,
        stagger: 0.02,
        ease: "power2.in",
        onComplete: () => {
          infoOverlay.classList.add('u-display-none');
          // Reset for next open
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

  // Click handler for Info button
  const onInfoClick = (e) => {
    if (e.target.textContent.trim() === 'Info') {
      e.preventDefault();
      if (isOpen) {
        close();
      } else {
        open();
      }
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

  container.addEventListener('click', onInfoClick);
  document.addEventListener('keydown', onKeyDown);
  infoOverlay.addEventListener('click', onOverlayClick);

  handlers.push(() => {
    container.removeEventListener('click', onInfoClick);
    document.removeEventListener('keydown', onKeyDown);
    infoOverlay.removeEventListener('click', onOverlayClick);
  });

  // Cleanup
  return () => {
    if (revealTimeline) revealTimeline.kill();
    handlers.forEach(fn => fn());
    delete infoOverlay.dataset.scriptInitialized;
  };
}