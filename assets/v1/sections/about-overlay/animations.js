// assets/v1/sections/about-overlay/animations.js
// FIXED: Removed ALL staggers for smooth fade
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

  const elements = [
    '.about-bio-label',
    '.about-bio-content',
    '.about-contact-label',
    '.about-contact-link',
    '.about-work-label',
    '.about-work-link', // Multiple links here - no stagger!
    '.about-awards-label',
    '.about-award-item'
  ];

  // Set initial states
  gsap.set(elements, {
    opacity: 0,
    willChange: 'opacity'
  });

  // Simple timeline - all fade in together, NO STAGGER
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(elements, { willChange: 'auto' });
    }
  });

  // Just fade everything in smoothly - NO STAGGER ANYWHERE
  tl.to(elements, {
    opacity: 1,
    duration: 0.3, // Quick and smooth
    ease: "power2.out"
    // NO stagger property - this was causing the work links to stagger
  });

  return tl;
}