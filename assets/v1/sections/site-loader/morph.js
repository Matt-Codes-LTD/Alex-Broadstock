// morph.js - Enhanced FLIP morphing with completion callback

export function morphToHeroStage(videoWrapper, heroContainer, duration = 1.4, onComplete) {
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
  
  // Find the video element inside wrapper and ensure it keeps playing
  const video = videoWrapper.querySelector('video');
  if (video && !video.paused) {
    console.log("[Morph] Ensuring video keeps playing during morph");
  }
  
  // GPU acceleration
  gsap.set(videoWrapper, {
    willChange: 'transform',
    force3D: true,
    zIndex: 10 // Keep above hero during morph
  });
  
  // Create morph WITHOUT opacity fade - keep video fully visible
  return gsap.timeline()
    .to(videoWrapper, {
      x: dx,
      y: dy,
      scaleX: scale,
      scaleY: scale,
      duration,
      ease: 'power3.inOut',
      force3D: true,
      onUpdate: () => {
        // Keep video playing during morph
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      },
      onComplete: () => {
        console.log("[Morph] Animation complete");
        // Call the completion callback if provided
        if (onComplete) {
          onComplete();
        }
      }
    })
    .set(videoWrapper, { 
      willChange: 'auto',
      zIndex: 5 // Keep relatively high even after morph
    });
}