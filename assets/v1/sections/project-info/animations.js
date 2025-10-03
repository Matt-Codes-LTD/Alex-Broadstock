// assets/v1/sections/project-info/animations.js
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
    y: 20,
    filter: "blur(8px)"
  });

  const tl = gsap.timeline();

  // Description - slower, more elegant
  tl.to('.project-info_description', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.8,
    ease: "power3.out"
  })

  // Crew label - quick follow
  .to('.project-info_crew-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.5")

  // Crew items - tight cascade
  .to('.project-info_crew-role', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.5,
    stagger: 0.12,
    ease: "power2.out"
  }, "-=0.35")
  
  .to('.project-info_crew-name', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.5,
    stagger: 0.12,
    ease: "power2.out"
  }, "-=0.45") // Start just slightly after roles begin

  // Awards label
  .to('.project-info_awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.6,
    ease: "power2.out"
  }, "-=0.4")

  // Awards - playful bounce
  .to('.project-info_award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.5,
    stagger: 0.08,
    ease: "back.out(1.4)"
  }, "-=0.35");

  return tl;
}