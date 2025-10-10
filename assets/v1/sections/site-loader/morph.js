// morph.js - Enhanced FLIP morphing with better video preservation

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
  
  // Create a smooth morph without aggressive opacity changes
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
      }
    })
    // Very subtle fade - don't go too low as it might affect video
    .to(videoWrapper, {
      opacity: 0.9, // Changed from 0.7 to maintain better visibility
      duration: 0.2, // Shorter duration
      ease: 'none'
    }, "-=0.2")
    .set(videoWrapper, { 
      willChange: 'auto',
      zIndex: 1 // Lower z-index after morph
    });
}