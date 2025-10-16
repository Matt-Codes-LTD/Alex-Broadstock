// assets/v1/sections/project-info/animations.js
// UPDATED: 50% faster with aggressive easing
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

  // Set initial states with subtle blur for depth
  gsap.set([
    '.project-info_description',
    '.project-info_crew-label',
    '.project-info_crew-role',
    '.project-info_crew-name',
    '.project-info_awards-label',
    '.project-info_award-item'
  ], {
    opacity: 0,
    y: 12,
    filter: "blur(6px)",
    willChange: 'transform, opacity' // Performance
  });

  const tl = gsap.timeline({
    onComplete: () => {
      // Remove will-change after animation
      gsap.set([
        '.project-info_description',
        '.project-info_crew-label',
        '.project-info_crew-role',
        '.project-info_crew-name',
        '.project-info_awards-label',
        '.project-info_award-item'
      ], { willChange: 'auto' });
    }
  });

  // Description - 50% FASTER
  tl.to('.project-info_description', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.2, // Was 0.4
    ease: "power4.out" // More aggressive
  })

  // Crew label - 50% FASTER
  .to('.project-info_crew-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.175, // Was 0.35
    ease: "power4.out"
  }, "-=0.15")

  // Crew roles - 50% FASTER
  .to('.project-info_crew-role', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.15, // Was 0.3
    stagger: 0.03, // Was 0.06
    ease: "power4.out"
  }, "-=0.125")
  
  // Crew names - 50% FASTER
  .to('.project-info_crew-name', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.15, // Was 0.3
    stagger: 0.03, // Was 0.06
    ease: "power4.out"
  }, "-=0.125")

  // Awards label - 50% FASTER
  .to('.project-info_awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.175, // Was 0.35
    ease: "power4.out"
  }, "-=0.125")

  // Awards - 50% FASTER with snappier bounce
  .to('.project-info_award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.15, // Was 0.3
    stagger: 0.02, // Was 0.04
    ease: "back.out(1.7)" // More aggressive bounce
  }, "-=0.1");

  return tl;
}