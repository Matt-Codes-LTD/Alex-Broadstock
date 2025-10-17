// morph.js - Enhanced FLIP morphing with cinematic easing

export function morphToHeroStage(videoWrapper, heroContainer, duration = 1.6, onComplete) {
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
  
  // Register cinematic ease specifically for morph
  // This creates a very smooth, elegant acceleration and deceleration
  gsap.registerEase("morphCinematic", (p) => {
    // Custom curve for ultra-smooth cinematic movement
    // Gentle ease in, smooth acceleration, elegant ease out
    const p2 = p * p;
    const p3 = p2 * p;
    const p4 = p3 * p;
    const p5 = p4 * p;
    
    // Quint.InOut style but with adjusted curve for more cinematic feel
    return p < 0.5
      ? 16 * p5  // Gentle acceleration
      : 1 - Math.pow(-2 * p + 2, 5) / 2;  // Smooth deceleration
  });
  
  // Alternative cubic bezier style ease for comparison (if CustomEase plugin available)
  if (window.CustomEase) {
    gsap.registerEase("morphSmooth", CustomEase.create("morphSmooth", "0.25,0.46,0.45,0.94"));
  }
  
  // Create morph WITHOUT opacity fade - keep video fully visible
  return gsap.timeline()
    .to(videoWrapper, {
      x: dx,
      y: dy,
      scaleX: scale,
      scaleY: scale,
      duration,  // Now 1.6s for more elegant movement
      ease: 'morphCinematic',  // Custom cinematic ease
      force3D: true,
      onStart: () => {
        // Optional: Add very subtle rotation for more dynamic feel
        gsap.to(videoWrapper, {
          rotation: 0.5,  // Very subtle rotation
          duration: duration * 0.5,
          ease: "power2.in",
          yoyo: true,
          repeat: 1
        });
      },
      onUpdate: function() {
        // Keep video playing during morph
        if (video && video.paused) {
          video.play().catch(() => {});
        }
        
        // Optional: Log progress for debugging
        const progress = this.progress();
        if (progress === 0.25 || progress === 0.5 || progress === 0.75) {
          console.log(`[Morph] Progress: ${(progress * 100).toFixed(0)}%`);
        }
      },
      onComplete: () => {
        console.log("[Morph] Animation complete");
        
        // Reset any rotation
        gsap.set(videoWrapper, { rotation: 0 });
        
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