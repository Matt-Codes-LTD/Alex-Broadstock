// timeline.js - Optimized with faster curtain and cinematic morph
import { CONFIG, EASES } from "./constants.js";
import { ANIMATION, getAnimProps } from "../../core/animation-constants.js";
import { ensureVideoReady } from "./video-setup.js";
import { morphToHeroStage } from "./morph.js";

// Helper function to split text into spans (memoized)
const splitTextCache = new WeakMap();
function splitTextToSpans(element) {
  if (splitTextCache.has(element)) {
    return splitTextCache.get(element);
  }
  
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
  splitTextCache.set(element, chars);
  return chars;
}

export function createMainTimeline({ state, ui, video, container, loaderEl, lock, onComplete }) {
  // Register custom eases
  gsap.registerEase("custom2InOut", p => 
    p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2
  );
  
  // New cinematic ease for morph - smoother acceleration/deceleration
  gsap.registerEase("cinematicInOut", p => {
    // Custom cubic-bezier inspired ease for cinematic feel
    if (p < 0.5) {
      return 4 * p * p * p;
    } else {
      const f = (2 * p) - 2;
      return 1 + f * f * f / 2;
    }
  });
  
  // Setup name element
  const nameEl = ui.nameReveal;
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
  
  // Simplified resume handler
  let heroReadyResolve = null;
  const heroReadyPromise = new Promise(resolve => {
    heroReadyResolve = resolve;
  });
  
  const onHeroReadyForReveal = () => {
    console.log("[SiteLoader] Hero ready - resuming timeline");
    if (heroReadyResolve) {
      heroReadyResolve();
      heroReadyResolve = null;
    }
  };
  
  state.heroReadyListener = onHeroReadyForReveal;
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });
  
  // Track morph completion
  let morphComplete = false;
  
  // Main timeline - OPTIMIZED FOR SPEED
  const tl = gsap.timeline({ onComplete });

  // Phase 0: Initial delay - FASTER (0.5s → 0.3s)
  tl.to({}, { duration: 0.3 })
  
  // Phase 1: Name reveal - slightly snappier stagger
  .to(nameChars, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    stagger: 0.012, // FASTER (0.015 → 0.012)
    ease: "power2.out"
  })
  
  // Phase 2: Prepare video - START EARLIER (+=0.3 → +=0.2)
  .call(async () => {
    try {
      await ensureVideoReady(video);
      video.currentTime = 0;
      video.muted = true;
      video.loop = true;
      await video.play();
      console.log("[SiteLoader] Video playing:", video.paused === false);
    } catch (err) {
      console.warn("[SiteLoader] Video play failed:", err);
    }
  }, null, "+=0.2")
  
  // Phase 3: Video fade-in - FASTER (0.4s → 0.3s, +=0.2 → +=0.1)
  .to(ui.videoWrapper, { 
    opacity: 0.6,
    duration: 0.3, 
    ease: "power2.in" 
  }, "+=0.1")
  
  // Name fade out - FASTER (0.5s → 0.4s)
  .to(nameChars, {
    opacity: 0,
    scale: 1.05,
    y: -3,
    duration: 0.4,
    stagger: 0.008, // Slightly faster stagger
    ease: "power2.inOut"
  }, "<")
  
  // Complete video reveal - FASTER (0.3s → 0.25s)
  .to(ui.videoWrapper, { 
    opacity: 1, 
    duration: 0.25, 
    ease: "power2.out" 
  }, "-=0.15")
  
  // Phase 4: Curtain reveal - MUCH FASTER (1.45s → 0.9s)
  .to(ui.videoCurtain, { 
    xPercent: 100, 
    duration: 0.9,  // Much faster curtain
    ease: "power3.in",  // Changed to power3.in for snappier curtain movement
    onStart: () => {
      if (video.paused) {
        console.log("[SiteLoader] Video paused at curtain reveal, restarting");
        video.play().catch(() => {});
      }
      console.log("[SiteLoader] Curtain revealing, video playing:", !video.paused);
    },
    onUpdate: () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    },
    onComplete: () => {
      try {
        if (video.paused) {
          console.log("[SiteLoader] Video paused after curtain, restarting");
          video.play().catch(() => {});
        }
        
        gsap.set(ui.videoWrapper, { opacity: 1, zIndex: 10 });
        
        // Updated morph with cinematic timing
        morphToHeroStage(ui.videoWrapper, ui.heroVideoContainer, 1.6, () => {
          morphComplete = true;
          console.log("[SiteLoader] Morph complete");
        });
        
        const checkPlayback = setInterval(() => {
          if (video.paused) {
            console.log("[SiteLoader] Video paused during morph, restarting");
            video.play().catch(() => {});
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkPlayback), 1700);
        
      } catch (err) {
        console.warn("[SiteLoader] Morph failed:", err);
      }
    }
  })
  
  // Phase 5: Handoff during morph - adjusted timing for new morph duration
  .call(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));  // Slightly delayed for smoother transition
    
    if (video.paused) {
      console.log("[SiteLoader] Video paused before handoff, restarting");
      video.play().catch(() => {});
    }
    
    if (ui.heroVideoContainer) {
      gsap.set(ui.heroVideoContainer, { opacity: 1, zIndex: 0 });
    }
    
    const firstProjectItem = container.querySelector('.home-hero_list:not([style*="display: none"]) .home-hero_item');
    const firstVideoUrl = firstProjectItem?.dataset?.video;
    
    const detail = {
      src: firstVideoUrl || null,
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      loaderVideo: video
    };
    
    console.log("[SiteLoader] Dispatching handoff event, video playing:", !video.paused);
    window.dispatchEvent(new CustomEvent("siteLoaderMorphBegin", { detail }));
    
    const timeoutPromise = new Promise(resolve => {
      state.heroResumeTimeout = setTimeout(resolve, 1400);  // Adjusted for new morph duration
    });
    
    await Promise.race([heroReadyPromise, timeoutPromise]);
    
    if (state.heroResumeTimeout) {
      clearTimeout(state.heroResumeTimeout);
      state.heroResumeTimeout = null;
    }
  }, null, "-=1.3")  // Adjusted overlap for new timing
  
  // Phase 6: Fade loader wrapper - delayed to match new morph
  .call(() => {
    gsap.delayedCall(1.2, () => {  // Slightly longer delay for smoother transition
      console.log("[SiteLoader] Starting loader wrapper fade");
      gsap.to(ui.videoWrapper, {
        opacity: 0,
        duration: 0.4,  // Slightly slower fade for elegance
        ease: "power2.in",
        onComplete: () => {
          console.log("[SiteLoader] Loader wrapper fade complete");
          if (ui.videoWrapper?.parentNode) {
            ui.videoWrapper.remove();
          }
        }
      });
    });
  })
  
  // Phase 7: Pause before reveal - FASTER (0.5s → 0.3s)
  .to({}, { duration: 0.3 })
  
  // Phase 8: HOME PAGE REVEAL (with faster timings)
  .call(() => {
    gsap.set(loaderEl, { zIndex: 1 });
    gsap.set([
      ".nav_wrap",
      ".home_hero_categories", 
      ".home-hero_menu",
      ".home-awards_list"
    ], {
      visibility: "visible",
      opacity: 1
    });
    gsap.set([
      ".brand_logo",
      ".nav_link",
      ".home-category_text"
    ], {
      visibility: "visible"
    });
    gsap.set([
      ".home_hero_text",
      ".home-category_ref_text:not([hidden])",
      ".home-awards_list"
    ], {
      opacity: 0
    });
  })
  
  // Nav wrapper - FASTER (0.8s → 0.65s)
  .fromTo(".nav_wrap", {
    opacity: 0, 
    y: ANIMATION.TRANSFORM.navY
  }, {
    opacity: 1, 
    y: 0,
    duration: 0.65,
    ease: "power3.out"
  })
  
  // Brand logo - FASTER (0.6s → 0.5s)
  .fromTo(".brand_logo", {
    opacity: 0, 
    scale: ANIMATION.TRANSFORM.scaleSmall
  }, {
    opacity: 1, 
    scale: 1,
    duration: 0.5,
    ease: "back.out(1.2)"
  }, "-=0.45")
  
  // Nav links - FASTER (0.5s → 0.4s, stagger 0.08 → 0.06)
  .fromTo(".nav_link", {
    opacity: 0, 
    x: ANIMATION.TRANSFORM.tagX
  }, {
    opacity: 1, 
    x: 0,
    duration: 0.4,
    stagger: 0.06,
    ease: "power2.out"
  }, "-=0.35")
  
  // Category filters - FASTER (0.6s → 0.5s)
  .fromTo(".home-category_text", {
    opacity: 0, 
    y: ANIMATION.TRANSFORM.textY, 
    rotateX: ANIMATION.TRANSFORM.rotateX
  }, {
    opacity: 1, 
    y: 0, 
    rotateX: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power3.out"
  }, "-=0.4")
  
  // Project rows - FASTER durations
  .add(() => {
    const visibleRows = container.querySelectorAll(".home-hero_list:not([style*='display: none'])");
    
    visibleRows.forEach((row, index) => {
      const name = row.querySelector(".home_hero_text");
      const tags = row.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (name) {
        gsap.fromTo(name, {
          opacity: 0, 
          x: ANIMATION.TRANSFORM.textX, 
          filter: ANIMATION.FILTER.blur
        }, {
          opacity: 1, 
          x: 0, 
          filter: ANIMATION.FILTER.blurNone,
          duration: 0.45, // FASTER (was 0.5-0.6)
          ease: "power2.out",
          delay: index * 0.08 // FASTER stagger
        });
      }
      
      if (tags.length) {
        gsap.fromTo(tags, {
          opacity: 0, 
          x: ANIMATION.TRANSFORM.tagX
        }, {
          opacity: 1, 
          x: 0,
          duration: 0.4, // FASTER
          ease: "power2.out",
          delay: index * 0.08,
          stagger: 0.015 // Slightly faster
        });
      }
    });
  }, "-=0.15")
  
  // ❌ REMOVED: Mobile filters button animation (now handled by mobile-filters module)
  
  // Awards strip - FASTER
  .add(() => {
    const awardsList = container.querySelector(".home-awards_list");
    
    if (!awardsList) {
      console.warn("[SiteLoader] Awards list not found");
      return;
    }
    
    const awardsItems = awardsList.querySelectorAll(":scope > *");
    
    if (awardsItems.length > 0) {
      gsap.fromTo(awardsItems, {
        opacity: 0,
        y: 20,
        scale: 0.95
      }, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.4, // FASTER (was 0.5)
        ease: "power3.out",
        stagger: {
          amount: 0.25, // FASTER (was 0.3)
          from: "start"
        },
        delay: 0.2 // FASTER (was 0.3)
      });
    } else {
      gsap.fromTo(awardsList, {
        opacity: 0,
        y: 20,
        scale: 0.95
      }, {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.5, // FASTER (was 0.6)
        ease: "power3.out",
        delay: 0.2 // FASTER (was 0.3)
      });
    }
  }, "-=0.15")
  
  // Clear props
  .add(() => {
    gsap.set([
      ".nav_wrap",
      ".brand_logo",
      ".nav_link",
      ".home-category_text",
      ".home_hero_text",
      ".home-category_ref_text",
      ".home-awards_list",
      ".home-awards_list > *"
    ], {
      clearProps: "transform,filter"
    });
  })
  
  // Final fade - FASTER (0.5s → 0.4s)
  .to(loaderEl, { 
    opacity: 0, 
    duration: 0.4, 
    ease: "power2.inOut" 
  }, "-=0.2")
  
  .call(() => { 
    window.dispatchEvent(new CustomEvent("siteLoaderComplete")); 
  });
  
  return tl;
}