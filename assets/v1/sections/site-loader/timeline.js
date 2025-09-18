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
  
  // IMPORTANT: Add pause label here, BEFORE the reveal phases
  tl.addPause("await-hero-ready");
  
  // These phases will play after resume
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
        // Start morphing immediately when curtain finishes
        morphToHeroStage(ui.videoWrapper, ui.heroVideoContainer);
      }
    });
}

function addMorphPhase(tl, state, ui, video, container) {
  tl
    // Fade UI elements while morphing happens
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
    // Handoff event - THIS IS KEY
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
      
      console.log("[SiteLoader] Dispatching morphBegin event");
      window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
      
      // IMPORTANT: Set up the resume mechanism
      const resumeTimeline = () => {
        console.log("[SiteLoader] Resuming timeline from hero ready event");
        tl.play(); // Resume the timeline
      };
      
      // Listen for hero ready
      window.addEventListener("homeHeroReadyForReveal", resumeTimeline, { once: true });
      
      // Fallback timeout
      state.heroResumeTimeout = setTimeout(() => {
        console.log("[SiteLoader] Fallback timeout - resuming timeline");
        window.removeEventListener("homeHeroReadyForReveal", resumeTimeline);
        tl.play();
      }, 1500);
    }, null, "-=1.2");
    // Don't add pause here - it's added after this phase
}

function addUIFadePhase(tl, ui) {
  // This phase runs AFTER the pause is resumed
  tl.set(loaderEl, { zIndex: 1 }); // Move loader behind content
}

function addHeroRevealPhase(tl, container, loaderEl, ui) {
  console.log("[SiteLoader] Starting hero reveal phase");
  
  tl
    .set(loaderEl, { zIndex: 1 }) // Move loader behind content
    .set([
      ".nav_wrap",
      ".home_hero_categories", 
      ".home-hero_menu",
      ".home-awards_list"
    ], {
      visibility: "visible",
      opacity: 1  // Ensure parent containers are visible
    })
    .set([
      ".brand_logo",
      ".nav_link",
      ".home-category_text"
    ], {
      visibility: "visible"
    })
    // Keep project elements hidden until animation
    .set([
      ".home_hero_text",
      ".home-category_ref_text:not([hidden])",
      ".home-awards_list"
    ], {
      opacity: 0
    })
    // Nav wrapper foundation
    .fromTo(".nav_wrap", {
      opacity: 0,
      y: -20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    // Brand logo
    .fromTo(".brand_logo", {
      opacity: 0,
      scale: 0.9
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.2)"
    }, "-=0.5")
    // Nav links
    .fromTo(".nav_link", {
      opacity: 0,
      x: 20
    }, {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.08,
      ease: "power2.out"
    }, "-=0.4")
    // Category filters
    .fromTo(".home-category_text", {
      opacity: 0,
      y: 15,
      rotateX: -45
    }, {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: "power3.out"
    }, "-=0.5")
    // Project rows
    .add(() => {
      const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
      visibleRows.forEach((row, index) => {
        const name = row.querySelector(".home_hero_text");
        const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
        
        // Animate name from left
        if (name) {
          gsap.fromTo(name, {
            opacity: 0,
            x: -30,
            filter: "blur(4px)"
          }, {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power2.out",
            delay: index * 0.05
          });
        }
        
        // Animate tags from right simultaneously
        if (tags.length) {
          gsap.fromTo(tags, {
            opacity: 0,
            x: 20
          }, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: "power2.out",
            delay: index * 0.05,
            stagger: 0.02
          });
        }
      });
    }, "-=0.2")
    // Awards strip
    .fromTo(".home-awards_list", {
      opacity: 0,
      y: 20,
      scale: 0.95
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.3,
      onComplete: () => {
        // Clean up will-change properties
        gsap.set([
          ".nav_wrap",
          ".brand_logo",
          ".nav_link",
          ".home-category_text",
          ".home_hero_text",
          ".home-category_ref_text",
          ".home-awards_list"
        ], {
          clearProps: "transform,filter"
        });
      }
    });
}

function addCleanupPhase(tl, ui, loaderEl) {
  tl.to([ui.videoWrapper, loaderEl], {
    opacity: 0,
    duration: 0.6,
    ease: "power2.inOut"
  }, "-=0.8")
  .call(() => {
    console.log("[SiteLoader] Timeline complete");
  });
}