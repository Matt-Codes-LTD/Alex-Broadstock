// assets/v1/sections/project-info/animations.js
// SIMPLIFIED: No stagger, just smooth fade in
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

  const elements = [
    '.project-info_description',
    '.project-info_crew-label',
    '.project-info_crew-role',
    '.project-info_crew-name',
    '.project-info_awards-label',
    '.project-info_award-item'
  ];

  // Set initial states
  gsap.set(elements, {
    opacity: 0,
    willChange: 'opacity'
  });

  // Simple timeline - all fade in together, no stagger
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(elements, { willChange: 'auto' });
    }
  });

  // Just fade everything in smoothly
  tl.to(elements, {
    opacity: 1,
    duration: 0.3, // Quick and smooth
    ease: "power2.out"
  });

  return tl;
}