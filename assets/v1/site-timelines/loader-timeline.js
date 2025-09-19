// site-timelines/loader-timeline.js
import { updateProgressUI, updateEdgesUI, updateFPSUI } from "../sections/site-loader/ui-elements.js";
import { ensureVideoReady } from "../sections/site-loader/video-setup.js";
import { morphToHeroStage } from "../sections/site-loader/morph.js";
import { createHeroRevealTimeline } from "./hero-reveal-timeline.js";

function splitTextToSpans(element) {
  const text = element.textContent;
  element.innerHTML = '';
  
  const chars = text.split('').map((char, i) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateY(8px)';
    if (char === ' ') span.style.width = '0.3em';
    return span;
  });
  
  chars.forEach(span => element.appendChild(span));
  return chars;
}

export function createLoaderTimeline({ 
  state, 
  ui, 
  video, 
  container, 
  loaderEl, 
  onComplete,
  onHeroReady 
}) {
  // Register custom eases
  gsap.registerEase("custom2InOut", p => 
    p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2
  );
  
  // Setup name element
  const nameEl = loaderEl.querySelector('.site-loader_name_reveal');
  let nameChars = [];
  
  if (nameEl) {
    gsap.set(nameEl, { 
      opacity: 1, 
      visibility: 'visible',
      position: 'absolute',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      zIndex: 10
    });
    nameChars = splitTextToSpans(nameEl);
  }
  
  const tl = gsap.timeline({ onComplete });

  // Phase 1: Progress animation
  tl.to(state.progress, {
    value: 1, 
    fps: 120, 
    duration: 3, 
    ease: "sine.inOut",
    onUpdate: () => {
      const pct = Math.round(state.progress.value * 100);
      updateProgressUI(ui.progressText, pct);
      updateEdgesUI(ui.edgesBox, state.progress.value);
      updateFPSUI(ui.fpsCounter, state.progress.fps);
      
      if (state.progress.value >= 0.8 && video && !video.__started) {
        video.__started = true;
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  })
  
  // Phase 2: Fade progress text
  .to(ui.progressText, { opacity: 0, duration: 0.3 })
  
  // Name reveal
  .to(nameChars, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.02,
    ease: "power2.out"
  }, "-=0.1")
  
  // Prepare video
  .call(async () => {
    await ensureVideoReady(video);
  }, null, "+=0.3")
  
  // Video fade-in
  .to(ui.videoWrapper, { 
    opacity: 0.5,
    duration: 0.4, 
    ease: "power2.in" 
  }, "+=0.2")
  
  // Name fade-out
  .to(nameChars, {
    opacity: 0,
    scale: 1.05,
    y: -3,
    duration: 0.5,
    stagger: 0.01,
    ease: "power2.inOut"
  }, "<")
  
  // Complete video reveal
  .to(ui.videoWrapper, { 
    opacity: 1, 
    duration: 0.3, 
    ease: "power2.out" 
  }, "-=0.2")
  
  .to(ui.videoCurtain, { 
    xPercent: 100, 
    duration: 1.6, 
    ease: "custom2InOut",
    onComplete: () => {
      morphToHeroStage(ui.videoWrapper, ui.heroVideoContainer, 1.8);
    }
  })
  
  // Fade UI elements
  .to([ui.corners, ui.fpsCounter], { 
    opacity: 0, 
    duration: 0.6, 
    stagger: 0.02 
  }, "-=1.4")
  
  .to(ui.edgesBox, { 
    opacity: 0, 
    scale: 1.5, 
    duration: 0.7, 
    ease: "power3.inOut" 
  }, "<0.024")
  
  // Handoff
  .call(() => {
    if (ui.heroVideoContainer) {
      gsap.set(ui.heroVideoContainer, { opacity: 1, zIndex: 0 });
    }
    
    const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
    const firstVideoUrl = firstProjectItem?.dataset?.video;
    
    const detail = {
      src: firstVideoUrl || null,
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      loaderVideo: video,
      loaderWrapper: ui.videoWrapper
    };
    
    window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
    if (onHeroReady) {
      state.heroResumeTimeout = setTimeout(onHeroReady, 1500);
    }
  }, null, "-=1.2")
  
  // Add pause point
  .addPause("await-hero-ready")
  
  // Hero reveal (after resume)
  .add(() => createHeroRevealTimeline(container).play())
  
  // Final fade
  .to([ui.videoWrapper, loaderEl], { 
    opacity: 0, 
    duration: 0.6, 
    ease: "power2.inOut" 
  }, "-=0.8")
  
  .call(() => { 
    window.dispatchEvent(new CustomEvent("siteLoaderComplete")); 
  });
  
  return {
    timeline: tl,
    play: () => tl.play(),
    pause: () => tl.pause(),
    resume: () => tl.play(),
    kill: () => {
      if (state.heroResumeTimeout) clearTimeout(state.heroResumeTimeout);
      tl.kill();
    }
  };
}