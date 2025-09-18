// site-loader/morph.js - FLIP morphing animation
import { CONFIG } from "./constants.js";

export function morphToHeroStage(videoWrapper, heroContainer, duration = CONFIG.ANIMATION.morphDuration) {
  if (!heroContainer || !videoWrapper) return null;
  
  const from = videoWrapper.getBoundingClientRect();
  const to = heroContainer.getBoundingClientRect();
  
  const fromCx = from.left + from.width / 2;
  const fromCy = from.top + from.height / 2;
  const toCx = to.left + to.width / 2;
  const toCy = to.top + to.height / 2;
  
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  
  // Use larger scale for cover behavior
  const scale = Math.max(
    to.width / from.width,
    to.height / from.height
  );
  
  // GPU acceleration
  gsap.set(videoWrapper, {
    willChange: 'transform',
    force3D: true
  });
  
  return gsap.to(videoWrapper, {
    x: dx,
    y: dy,
    scaleX: scale,
    scaleY: scale,
    duration,
    ease: 'power3.inOut',
    force3D: true,
    onComplete: () => {
      gsap.set(videoWrapper, { willChange: 'auto' });
    }
  });
}