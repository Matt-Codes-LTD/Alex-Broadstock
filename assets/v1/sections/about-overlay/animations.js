// assets/v1/sections/about-overlay/animations.js
// UPDATED: 50% faster with aggressive easing
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

  // Set initial states with blur for depth
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
    filter: "blur(6px)",
    willChange: 'transform, opacity' // Performance
  });

  const tl = gsap.timeline({
    onComplete: () => {
      // Remove will-change after animation
      gsap.set([
        '.about-bio-label',
        '.about-bio-content',
        '.about-contact-label',
        '.about-contact-link',
        '.about-work-label',
        '.about-work-link',
        '.about-awards-label',
        '.about-award-item'
      ], { willChange: 'auto' });
    }
  });

  // Bio section first - 50% FASTER
  tl.to('.about-bio-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.2, // Was 0.4
    ease: "power4.out" // More aggressive
  })
  
  .to('.about-bio-content', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.25, // Was 0.5
    ease: "power4.out" // More aggressive
  }, "-=0.15") // Tighter overlap

  // Contact section - 50% FASTER
  .to('.about-contact-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.2, // Was 0.4
    ease: "power4.out"
  }, "-=0.175")
  
  .to('.about-contact-link', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.175, // Was 0.35
    ease: "power4.out"
  }, "-=0.125")

  // Work section - 50% FASTER
  .to('.about-work-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.2, // Was 0.4
    ease: "power4.out"
  }, "-=0.15")
  
  .to('.about-work-link', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.175, // Was 0.35
    stagger: 0.025, // Was 0.05
    ease: "power4.out"
  }, "-=0.125")

  // Awards section - 50% FASTER
  .to('.about-awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.2, // Was 0.4
    ease: "power4.out"
  }, "-=0.125")
  
  .to('.about-award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.175, // Was 0.35
    stagger: 0.02, // Was 0.04
    ease: "back.out(1.7)" // More aggressive bounce
  }, "-=0.125");

  return tl;
}