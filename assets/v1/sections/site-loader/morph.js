// morph.js - Enhanced FLIP morphing with overlay fade

export function morphToHeroStage(videoWrapper, heroContainer, duration = 1.4) {
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
    force3D: true,
    zIndex: 10 // Keep above hero during morph
  });
  
  // Create a smooth morph with easing adjustments
  return gsap.timeline()
    .to(videoWrapper, {
      x: dx,
      y: dy,
      scaleX: scale,
      scaleY: scale,
      duration,
      ease: 'power3.inOut',
      force3D: true
    })
    // Fade wrapper slightly as hero takes over
    .to(videoWrapper, {
      opacity: 0.7,
      duration: 0.3,
      ease: 'none'
    }, "-=0.3")
    .set(videoWrapper, { 
      willChange: 'auto',
      zIndex: 1 // Lower z-index after morph
    });
}