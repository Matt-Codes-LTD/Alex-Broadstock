// site-loader/timeline.js - Timeline creation
import { CONFIG, EASES } from "./constants.js";
import { updateProgressUI, updateEdgesUI, updateFPSUI } from "./ui-elements.js";
import { startVideoPlayback, ensureVideoReady } from "./video-setup.js";
import { morphToHeroStage } from "./morph.js";
import { revealHeroContent, prepareHeroStage } from "./reveal-animations.js";

export function createMainTimeline({ state, ui, video, container, loaderEl, onComplete }) {
  // Register custom eases
  registerCustomEases();
  
  const tl = gsap.timeline({
    onComplete: () => {
      onComplete?.();
      window.dispatchEvent(new CustomEvent("siteLoaderComplete"));
    }
  });
  
  // Build timeline phases
  addProgressPhase(tl, state, ui, video);
  addVideoRevealPhase(tl, ui, video);
  addMorphPhase(tl, state, ui, video, container);
  addUIFadePhase(tl, ui);
  addHeroRevealPhase(tl, container, loaderEl, ui);
  addCleanupPhase(tl, ui, loaderEl);
  
  return tl;
}

function registerCustomEases() {
  gsap.registerEase("custom2InOut", p => 
    p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2
  );
  
  gsap.registerEase("o4", p => 1 - Math.pow(1 - p, 4));
}

function addProgressPhase(tl, state, ui, video) {
  tl.to(state.progress, {
    value: 1,
    fps: 120,
    duration: CONFIG.PROGRESS.duration,
    ease: EASES.sineInOut,
    onUpdate: () => {
      updateProgressUI(ui.progressText, state.progress.value);
      updateEdgesUI(ui.edgesBox, state.progress.value);
      updateFPSUI(ui.fpsCounter, state.progress.fps);
      startVideoPlayback(video, state.progress.value);
    }
  });
}

function addVideoRevealPhase(tl, ui, video) {
  tl
    .to(ui.progressText, {
      opacity: 0,
      duration: CONFIG.ANIMATION.fadeTextDuration
    })
    .call(async () => {
      await ensureVideoReady(video);
    })
    .to(ui.videoWrapper, {
      opacity: 1,
      duration: CONFIG.ANIMATION.revealVideoDuration,
      ease: EASES.powerOut
    })
    .to(ui.videoCurtain, {
      xPercent: 100,
      duration: CONFIG.ANIMATION.curtainDuration,
      ease: EASES.custom2InOut,
      onComplete: () => {
        morphToHeroStage(ui.videoWrapper, ui.heroVideoContainer);
      }
    });
}

function addMorphPhase(tl, state, ui, video, container) {
  tl
    .to([ui.corners, ui.fpsCounter], {
      opacity: 0,
      duration: CONFIG.ANIMATION.uiFadeDuration,
      stagger: 0.02
    }, "-=1.4")
    .to(ui.edgesBox, {
      opacity: 0,
      scale: 1.5,
      duration: CONFIG.ANIMATION.edgesFadeDuration,
      ease: EASES.power3InOut
    }, "<0.024")
    .call(() => {
      prepareHeroStage(ui.heroVideoContainer);
      
      // Dispatch handoff event
      const detail = {
        src: video?.src || null,
        currentTime: video?.currentTime || 0,
        duration: video?.duration || 0,
        loaderVideo: video,
        loaderWrapper: ui.videoWrapper
      };
      
      window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
      
      // Fallback timeout
      state.heroResumeTimeout = setTimeout(() => {
        tl.play();
      }, 1500);
    }, null, "-=1.2")
    .addPause("await-hero-ready");
}

function addHeroRevealPhase(tl, container, loaderEl, ui) {
  tl
    .set(loaderEl, { zIndex: 1 }) // Move loader behind
    .add(() => revealHeroContent(container));
}

function addCleanupPhase(tl, ui, loaderEl) {
  tl.to([ui.videoWrapper, loaderEl], {
    opacity: 0,
    duration: 0.6,
    ease: "power2.inOut"
  }, "-=0.8");
}