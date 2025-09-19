// site-loader/timeline.js - Timeline creation with mobile filters integration
import { CONFIG, EASES } from "./constants.js";
import { updateProgressUI, updateEdgesUI, updateFPSUI } from "./ui-elements.js";
import { ensureVideoReady } from "./video-setup.js";
import { morphToHeroStage } from "./morph.js";

// Helper function to split text into spans
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

export function createMainTimeline({ state, ui, video, container, loaderEl, lock, onComplete }) {
  // Register custom eases
  gsap.registerEase("custom2InOut", p => 
    p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2
  );
  
  // Setup name element
  const nameEl = loaderEl.querySelector('.site-loader_name_reveal');
  let nameChars = [];
  
  // Prevent FOUC - set initial state
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
  
  // Resume handler
  const onHeroReadyForReveal = () => { 
    console.log("[SiteLoader] Hero ready - resuming timeline");
    tl.play(); 
  };
  
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });
  state.heroReadyListener = onHeroReadyForReveal;
  
  // Main timeline
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
      
      // Start video at 80%
      if (state.progress.value >= 0.8 && video && !video.__started) {
        video.__started = true;
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  })
  
  // Phase 2: Fade progress text
  .to(ui.progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 2a: Name reveal animation
  .to(nameChars, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.02,
    ease: "power2.out"
  }, "-=0.1")
  
  // Phase 2.5: Prepare video while name is visible
  .call(async () => {
    await ensureVideoReady(video);
  }, null, "+=0.3")
  
  // Phase 3: Begin video fade-in behind name
  .to(ui.videoWrapper, { 
    opacity: 0.5,
    duration: 0.4, 
    ease: "power2.in" 
  }, "+=0.2")
  
  // Phase 2b: Name scales up and fades as video takes over
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
  
  // Phase 4: Fade UI elements while morphing
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
  
  // Phase 5: Handoff during morph
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
    state.heroResumeTimeout = setTimeout(onHeroReadyForReveal, 1500);
  }, null, "-=1.2")
  
  // CRITICAL: Add pause here
  .addPause("await-hero-ready")
  
  // Phase 6: Hero reveal (plays after resume)
  .set(loaderEl, { zIndex: 1 })
  .set([
    ".nav_wrap",
    ".home_hero_categories", 
    ".home-hero_menu",
    ".home-awards_list"
  ], {
    visibility: "visible",
    opacity: 1
  })
  .set([
    ".brand_logo",
    ".nav_link",
    ".home-category_text"
  ], {
    visibility: "visible"
  })
  .set([
    ".home_hero_text",
    ".home-category_ref_text:not([hidden])",
    ".home-awards_list"
  ], {
    opacity: 0
  })
  
  // Nav animation
  .fromTo(".nav_wrap", {
    opacity: 0, y: -20
  }, {
    opacity: 1, y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  
  // Brand logo
  .fromTo(".brand_logo", {
    opacity: 0, scale: 0.9
  }, {
    opacity: 1, scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5")
  
  // Nav links
  .fromTo(".nav_link", {
    opacity: 0, x: 20
  }, {
    opacity: 1, x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  
  // Category filters
  .fromTo(".home-category_text", {
    opacity: 0, y: 15, rotateX: -45
  }, {
    opacity: 1, y: 0, rotateX: 0,
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
      
      if (name) {
        gsap.fromTo(name, {
          opacity: 0, x: -30, filter: "blur(4px)"
        }, {
          opacity: 1, x: 0, filter: "blur(0px)",
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05
        });
      }
      
      if (tags.length) {
        gsap.fromTo(tags, {
          opacity: 0, x: 20
        }, {
          opacity: 1, x: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: index * 0.05,
          stagger: 0.02
        });
      }
    });
  }, "-=0.2")
  
  // Mobile filters button - appears after project rows
  .add(() => {
    const mobileFiltersButton = window.__mobileFiltersButton;
    if (mobileFiltersButton && window.innerWidth <= 991) {
      gsap.fromTo(mobileFiltersButton, {
        opacity: 0,
        y: 10,
        visibility: "hidden"
      }, {
        opacity: 1,
        y: 0,
        visibility: "visible",
        duration: 0.5,
        ease: "power2.out",
        delay: 0.2 // Small delay after project rows
      });
    }
  }, "-=0.1")
  
  // Awards strip
  .fromTo(".home-awards_list", {
    opacity: 0, y: 20, scale: 0.95
  }, {
    opacity: 1, y: 0, scale: 1,
    duration: 0.6,
    ease: "power3.out",
    delay: 0.3,
    onComplete: () => {
      // Clean up will-change
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
  })
  
  // Final fade
  .to([ui.videoWrapper, loaderEl], { 
    opacity: 0, 
    duration: 0.6, 
    ease: "power2.inOut" 
  }, "-=0.8")
  
  .call(() => { 
    window.dispatchEvent(new CustomEvent("siteLoaderComplete")); 
  });
  
  return tl;
}