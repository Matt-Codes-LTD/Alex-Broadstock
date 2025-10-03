// assets/v1/sections/project-info/animations.js
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";

export function createRevealAnimation(container) {
  if (!window.gsap) return null;

  // Set initial states using unified transform values
  gsap.set([
    '.project-info_description',
    '.project-info_crew-label',
    '.project-info_crew-role',
    '.project-info_crew-name',
    '.project-info_awards-label',
    '.project-info_award-item'
  ], {
    opacity: 0,
    y: ANIMATION.TRANSFORM.textY
  });

  const tl = gsap.timeline();

  // Description fades in first
  tl.to('.project-info_description', {
    opacity: 1,
    y: 0,
    ...getAnimProps('text')
  })

  // Crew label
  .to('.project-info_crew-label', {
    opacity: 1,
    y: 0,
    ...getAnimProps('text')
  }, `-=${ANIMATION.DELAY.sequential * 3}`)

  // Crew roles and names (staggered)
  .to('.project-info_crew-role, .project-info_crew-name', {
    opacity: 1,
    y: 0,
    ...getAnimProps('tags')
  }, `-=${ANIMATION.DELAY.sequential * 2}`)

  // Awards label
  .to('.project-info_awards-label', {
    opacity: 1,
    y: 0,
    ...getAnimProps('text')
  }, `-=${ANIMATION.DELAY.sequential * 3}`)

  // Awards grid (staggered)
  .to('.project-info_award-item', {
    opacity: 1,
    y: 0,
    duration: ANIMATION.DURATION.controlsShort,
    stagger: ANIMATION.STAGGER.controls,
    ease: ANIMATION.EASE.controls
  }, `-=${ANIMATION.DELAY.sequential * 2}`);

  return tl;
}