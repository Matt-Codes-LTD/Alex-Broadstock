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
    y: 15,  // Reduced from 20
    filter: "blur(6px)"  // Reduced from 8px
  });

  const tl = gsap.timeline();

  // Description - faster
  tl.to('.project-info_description', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.5,  // Was 0.8
    ease: "power3.out"
  })

  // Crew label - tighter overlap
  .to('.project-info_crew-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,  // Was 0.6
    ease: "power2.out"
  }, "-=0.35")  // Was -=0.5

  // Crew roles - faster stagger
  .to('.project-info_crew-role', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,  // Was 0.5
    stagger: 0.08,  // Was 0.12
    ease: "power2.out"
  }, "-=0.25")  // Was -=0.35
  
  // Crew names - simultaneous
  .to('.project-info_crew-name', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,  // Was 0.5
    stagger: 0.08,  // Was 0.12
    ease: "power2.out"
  }, "-=0.30")  // Was -=0.45

  // Awards label - quick
  .to('.project-info_awards-label', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.4,  // Was 0.6
    ease: "power2.out"
  }, "-=0.25")  // Was -=0.4

  // Awards - snappy bounce
  .to('.project-info_award-item', {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 0.35,  // Was 0.5
    stagger: 0.05,  // Was 0.08
    ease: "back.out(1.4)"
  }, "-=0.25");  // Was -=0.35

  return tl;
}