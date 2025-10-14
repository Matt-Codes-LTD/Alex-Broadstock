// assets/v1/sections/project-info/animations.js
// UPDATED: Faster animations to match about overlay speed
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
    y: 12,  // REDUCED: Matches about overlay (was 15)
    filter: "blur(6px)"
  });

  const tl = gsap.timeline();

  // Description - faster
  tl.to('.project-info_description', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,  // REDUCED: Was 0.5
    ease: "power3.out"
  })

  // Crew label - tighter overlap
  .to('.project-info_crew-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,  // REDUCED: Was 0.4
    ease: "power2.out"
  }, "-=0.3")  // INCREASED: Was -=0.35

  // Crew roles - faster stagger
  .to('.project-info_crew-role', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.3,  // REDUCED: Was 0.35
    stagger: 0.06,  // REDUCED: Was 0.08
    ease: "power2.out"
  }, "-=0.25")
  
  // Crew names - simultaneous with tighter timing
  .to('.project-info_crew-name', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.3,  // REDUCED: Was 0.35
    stagger: 0.06,  // REDUCED: Was 0.08
    ease: "power2.out"
  }, "-=0.25")  // INCREASED: Was -=0.30

  // Awards label - quick
  .to('.project-info_awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,  // REDUCED: Was 0.4
    ease: "power2.out"
  }, "-=0.25")

  // Awards - snappy bounce
  .to('.project-info_award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.3,  // REDUCED: Was 0.35
    stagger: 0.04,  // REDUCED: Was 0.05 (matches about overlay)
    ease: "back.out(1.4)"
  }, "-=0.2");  // INCREASED: Was -=0.25

  return tl;
}