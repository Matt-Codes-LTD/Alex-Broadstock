// assets/v1/sections/about-overlay/animations.js
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
    filter: "blur(6px)"
  });

  const tl = gsap.timeline();

  // Bio section first
  tl.to('.about-bio-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power3.out"
  })
  
  .to('.about-bio-content', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.5,
    ease: "power3.out"
  }, "-=0.3")

  // Contact section
  .to('.about-contact-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power2.out"
  }, "-=0.35")
  
  .to('.about-contact-link', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,
    ease: "power2.out"
  }, "-=0.25")

  // Work section
  .to('.about-work-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power2.out"
  }, "-=0.3")
  
  .to('.about-work-link', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,
    stagger: 0.05,
    ease: "power2.out"
  }, "-=0.25")

  // Awards section
  .to('.about-awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,
    ease: "power2.out"
  }, "-=0.25")
  
  .to('.about-award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,
    stagger: 0.04,
    ease: "back.out(1.2)"
  }, "-=0.25");

  return tl;
}