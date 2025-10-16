// assets/v1/sections/about-overlay/animations.js
// FIXED: Disable CSS transitions that interfere with GSAP
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

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

  // CRITICAL: Disable ALL CSS transitions first
  gsap.set(elements, {
    clearProps: 'all', // Clear any previous GSAP properties
    transition: 'none' // Force disable CSS transitions
  });

  // Set initial states
  gsap.set(elements, {
    opacity: 0,
    willChange: 'opacity'
  });

  // Simple timeline - all fade in together, NO STAGGER
  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up after animation
      gsap.set(elements, { 
        willChange: 'auto',
        clearProps: 'transition' // Re-enable CSS transitions after animation
      });
    }
  });

  // Fade everything in smoothly - NO STAGGER
  tl.to(elements, {
    opacity: 1,
    duration: 0.3,
    ease: "power2.out"
    // Explicitly NO stagger property
  });

  return tl;
}