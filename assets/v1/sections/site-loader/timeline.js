// site-loader/timeline.js - Timeline creation with Enter button
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
  
  // Setup enter button and name element
  const enterEl = ui.enterButton;
  const nameEl = loaderEl.querySelector('.site-loader_name_reveal');
  let enterChars = [];
  let nameChars = [];
  
  // Setup Enter button
  if (enterEl) {
    gsap.set(enterEl, { 
      opacity: 1, 
      visibility: 'visible',
      position: 'absolute',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      zIndex: 100,
      cursor: 'pointer',
      pointerEvents: 'all'
    });
    enterChars = splitTextToSpans(enterEl);
  }
  
  // Setup name element but keep hidden
  if (nameEl) {
    gsap.set(nameEl, { 
      opacity: 1, 
      visibility: 'visible',
      position: 'absolute',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      zIndex: 10,
      display: 'none' // Hidden initially
    });
    nameChars = splitTextToSpans(nameEl);
  }
  
  // Hide all loader elements initially
  gsap.set([ui.progressText, ui.corners, ui.fpsCounter], { 
    opacity: 0,
    visibility: 'hidden'
  });
  gsap.set(ui.edgesBox, { 
    opacity: 0,
    visibility: 'hidden',
    "--sl-width": 67, 
    "--sl-height": 67 
  });
  
  // Resume handler
  const onHeroReadyForReveal = () => { 
    console.log("[SiteLoader] Hero ready - resuming timeline");
    tl.play(); 
  };
  
  window.addEventListener("homeHeroReadyForReveal", onHeroReadyForReveal, { once: true });
  state.heroReadyListener = onHeroReadyForReveal;
  
  // Main timeline - starts paused
  const tl = gsap.timeline({ 
    paused: true,
    onComplete 
  });
  
  // Animate Enter text in immediately
  if (enterEl && enterChars.length) {
    gsap.to(enterChars, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.03,
      ease: "power2.out"
    });
  }
  
  // Handle Enter click/touch
  const startLoader = () => {
    if (!enterEl) {
      tl.play();
      return;
    }
    
    // Disable further clicks
    enterEl.style.pointerEvents = 'none';
    
    // Mark user interaction for mobile autoplay
    window.__userInteracted = true;
    
    // Animate Enter text out
    gsap.to(enterChars, {
      opacity: 0,
      y: -5,
      scale: 0.95,
      duration: 0.4,
      stagger: 0.02,
      ease: "power2.inOut",
      onComplete: () => {
        enterEl.style.display = 'none';
        
        // Show and set initial state for loader elements
        gsap.set([ui.progressText, ui.corners, ui.fpsCounter], { 
          opacity: 1,
          visibility: 'visible'
        });
        gsap.set(ui.edgesBox, { 
          opacity: 1,
          visibility: 'visible',
          "--sl-width": 67, 
          "--sl-height": 67 
        });
        
        // Start video if we have interaction
        if (video && window.__userInteracted) {
          video.muted = true;
          video.play().catch(() => {});
        }
        
        // Play main timeline
        tl.play();
      }
    });
  };
  
  // Add interaction handlers
  if (enterEl) {
    enterEl.addEventListener('click', startLoader, { once: true });
    enterEl.addEventListener('touchend', (e) => {
      e.preventDefault();
      startLoader();
    }, { once: true, passive: false });
  } else {
    // No enter button, start immediately (fallback)
    setTimeout(() => {
      gsap.set([ui.progressText, ui.corners, ui.fpsCounter], { 
        opacity: 1,
        visibility: 'visible'
      });
      gsap.set(ui.edgesBox, { 
        opacity: 1,
        visibility: 'visible'
      });
      tl.play();
    }, 100);
  }

  // Build main timeline
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
      if (state.progress.value >= 0.8 && video && !video.__started && window.__userInteracted) {
        video.__started = true;
        video.currentTime = 0.001;
        video.play().catch(() => {});
      }
    }
  })
  
  // Phase 2: Fade progress text
  .to(ui.progressText, { opacity: 0, duration: 0.3 })
  
  // Phase 2a: Show and animate name
  .set(nameEl, { display: 'block' })
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
  
  // Continue with nav and content animations...
  .fromTo(".nav_wrap", {
    opacity: 0, y: -20
  }, {
    opacity: 1, y: 0,
    duration: 0.8,
    ease: "power3.out"
  })
  
  .fromTo(".brand_logo", {
    opacity: 0, scale: 0.9
  }, {
    opacity: 1, scale: 1,
    duration: 0.6,
    ease: "back.out(1.2)"
  }, "-=0.5")
  
  .fromTo(".nav_link", {
    opacity: 0, x: 20
  }, {
    opacity: 1, x: 0,
    duration: 0.5,
    stagger: 0.08,
    ease: "power2.out"
  }, "-=0.4")
  
  .fromTo(".home-category_text", {
    opacity: 0, y: 15, rotateX: -45
  }, {
    opacity: 1, y: 0, rotateX: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power3.out"
  }, "-=0.5")
  
  // Project rows reveal
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
  
  // Mobile filters button
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
        delay: 0.2
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