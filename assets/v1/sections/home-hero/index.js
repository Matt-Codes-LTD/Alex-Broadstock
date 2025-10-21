// index.js - UPDATED: Added swipe navigation for mobile/tablet
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";
import { initClientNames } from "./client-names.js";
import { initSwipeNavigation } from "./swipe-navigation.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  delete section.dataset.navigating;

  const videoStage  = section.querySelector(".home-hero_video");
  const listParent  = section.querySelector(".home-hero_list_parent");
  const awardsStrip = section.querySelector(".home-awards_list");
  
  if (!videoStage || !listParent) { 
    console.warn("[HomeHero] Missing required elements"); 
    return () => {};
  }

  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);

  let activeItem = null;
  let handoff = null;
  let revealedOnce = false;
  let hoverTimeout = null;
  let preloadTimeout = null;
  let currentAwardsHTML = "";
  let cleanupFunctions = [];
  let initialSetupDone = false;
  
  const emitReadyOnce = () => {
    if (revealedOnce) return;
    revealedOnce = true;
    window.dispatchEvent(new CustomEvent("homeHeroReadyForReveal"));
  };

  function initializeHero() {
    hideMetaTags();
    
    // Initialize client names
    const cleanupClientNames = initClientNames(section);
    cleanupFunctions.push(cleanupClientNames);
    
    // Set hero stage ready for video
    if (window.gsap) {
      gsap.set(videoStage, { opacity: 1, zIndex: 0 });
    } else {
      videoStage.style.opacity = "1";
      videoStage.style.zIndex = "0";
    }
    
    // Initialize category filter
    const cleanupFilter = initCategoryFilter(section, videoManager, (firstItem) => {
      if (!initialSetupDone && firstItem) {
        initialSetupDone = true;
        
        const enhancedHandoff = handoff ? {
          ...handoff,
          currentTime: handoff.loaderVideo?.currentTime || handoff.currentTime || 0
        } : null;
        
        setActive(firstItem, { 
          useHandoff: !!enhancedHandoff,
          handoff: enhancedHandoff
        });
      } else {
        setActive(firstItem);
      }
    });
    cleanupFunctions.push(cleanupFilter);
    
    // Initialize swipe navigation for mobile/tablet
    const cleanupSwipe = initSwipeNavigation(section, () => items);
    cleanupFunctions.push(cleanupSwipe);
    
    emitReadyOnce();
    section.dataset.introComplete = "true";
    
    // Preload other videos after initial setup
    setTimeout(() => preloadVideos(), 500);
  }

  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  let morphListener = null;
  
  if (hasSiteLoader && window.__initialPageLoad) {
    morphListener = (e) => {
      handoff = e?.detail || null;
      console.log("[HomeHero] Received handoff:", handoff);
      initializeHero();
    };
    window.addEventListener("siteLoaderMorphBegin", morphListener, { once: true });
  } else {
    requestAnimationFrame(() => initializeHero());
  }

  function updateAwards(item) {
    if (!awardsStrip) return;
    
    // Get the awards container (no longer looking for .w-dyn-items)
    const list = item.querySelector(".home-project_awards");
    
    if (!list) {
      console.warn("[HomeHero] No awards found for item:", item);
      return;
    }

    // Get all visible award items (ones that passed conditional visibility)
    const visibleAwards = list.querySelectorAll(".home-project_award:not(.w-condition-invisible)");
    
    if (visibleAwards.length === 0) {
      // No awards, clear the strip
      if (awardsStrip.innerHTML !== '') {
        const existingItems = awardsStrip.querySelectorAll(":scope > *");
        if (window.gsap && existingItems.length > 0) {
          gsap.to(existingItems, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            ease: "power2.in",
            stagger: 0.02,
            onComplete: () => {
              awardsStrip.innerHTML = '';
              currentAwardsHTML = '';
            }
          });
        } else {
          awardsStrip.innerHTML = '';
          currentAwardsHTML = '';
        }
      }
      return;
    }

    // Build HTML from visible awards
    const newHTML = Array.from(visibleAwards)
      .map(award => award.outerHTML)
      .join('');
    
    if (newHTML === currentAwardsHTML) return;
    
    currentAwardsHTML = newHTML;
    
    const existingItems = awardsStrip.querySelectorAll(":scope > *");
    
    if (window.gsap && existingItems.length > 0) {
      gsap.to(existingItems, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.02,
        onComplete: () => {
          awardsStrip.innerHTML = newHTML;
          const newItems = awardsStrip.querySelectorAll(":scope > *");
          
          if (newItems.length > 0) {
            gsap.fromTo(newItems, {
              opacity: 0,
              y: 10
            }, {
              opacity: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out",
              stagger: 0.03,
              delay: 0.1
            });
          }
        }
      });
    } else {
      awardsStrip.innerHTML = newHTML;
      
      if (window.gsap) {
        const newItems = awardsStrip.querySelectorAll(":scope > *");
        if (newItems.length > 0) {
          gsap.fromTo(newItems, {
            opacity: 0,
            y: 10
          }, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.03
          });
        }
      }
    }
  }

  function setActive(item, opts = {}) {
    if (!item || item === activeItem) return;
    activeItem = item;

    requestAnimationFrame(() => {
      // Fade all items
      items.forEach((i) => {
        const link  = i.querySelector(".home-hero_link");
        const text  = i.querySelector(".home_hero_text");
        const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");
        
        if (link) link.setAttribute("aria-current", "false");
        
        if (i.style.display !== "none") {
          text?.classList.add("u-color-faded");
          pills.forEach(p => p.classList.add("u-color-faded"));
        }
      });

      // Unfade active item
      const activeLink  = item.querySelector(".home-hero_link");
      const activeText  = item.querySelector(".home_hero_text");
      const activePills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (activeLink) activeLink.setAttribute("aria-current", "true");
      activeText?.classList.remove("u-color-faded");
      activePills.forEach(p => p.classList.remove("u-color-faded"));

      updateAwards(item);
    });

    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc  = projectEl?.dataset.video;
    const activeLink = item.querySelector(".home-hero_link");
    
    if (videoSrc) {
      videoManager.setActive(videoSrc, activeLink, {
        useHandoff: opts.useHandoff,
        handoff: opts.handoff,
        onVisible: opts.onVisible
      });
    }
  }

  function preloadVideos() {
    if (navigator.connection?.saveData) return;
    
    const MAX_EAGER = 3;
    let count = 0;
    
    items.forEach(item => {
      if (count >= MAX_EAGER) return;
      if (item.style.display === "none") return;
      
      const projectEl = item.querySelector(".home-hero_item");
      const videoSrc  = projectEl?.dataset.video;
      if (videoSrc && !videoManager.getVideo(videoSrc)) {
        const video = videoManager.createVideo(videoSrc);
        if (video) {
          videoManager.warmVideo(video);
          count++;
        }
      }
    });
  }

  function hideMetaTags() {
    section.querySelectorAll(".home-category_ref_text").forEach(tag => {
      const text = (tag.textContent || "").trim().toLowerCase();
      if (text === "selected") tag.setAttribute("hidden", "");
    });
  }

  // UPDATED: Immediate preload, faster response
  function preloadVideoForItem(item) {
    if (navigator.connection?.saveData) return;
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;
    if (videoSrc) {
      const video = videoManager.getVideo(videoSrc) || videoManager.createVideo(videoSrc);
      if (video) {
        video.__keepAlive = true;
        
        // Ensure video is loaded
        if (video.readyState < 2) {
          video.load();
        }
        
        if (!video.__warmed) {
          videoManager.warmVideo(video);
        }
        
        // Make sure it's playing smoothly
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  }

  // UPDATED: Faster interaction response
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item) || item.style.display === "none") return;
    
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    
    // IMMEDIATE preload (no delay)
    preloadVideoForItem(item);
    
    // REDUCED from 120ms to 30ms - snappier but still prevents accidents
    hoverTimeout = setTimeout(() => setActive(item), 30);
  }

  function handleClick(e) {
    const link = e.target.closest(".home-hero_url");
    
    if (link && !section.dataset.navigating) {
      sessionStorage.setItem("pp:autoplay-sound", "1");
    }
  }

  listParent.addEventListener("mouseenter", handleInteraction, true);
  listParent.addEventListener("focusin", handleInteraction);
  listParent.addEventListener("touchstart", handleInteraction, { passive: true });
  listParent.addEventListener("click", handleInteraction);
  listParent.addEventListener("click", handleClick, true);
  
  const handleVisibility = () => {
    if (document.hidden) {
      videoStage.querySelectorAll(".home-hero_video_el").forEach(v => {
        try { v.pause(); } catch {}
      });
    } else if (activeItem) {
      const projectEl = activeItem.querySelector(".home-hero_item");
      const videoSrc = projectEl?.dataset.video;
      if (videoSrc) {
        const video = videoManager.getVideo(videoSrc);
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    listParent.removeEventListener("click", handleClick, true);
    document.removeEventListener("visibilitychange", handleVisibility);
    
    if (morphListener) {
      window.removeEventListener("siteLoaderMorphBegin", morphListener);
    }
    
    cleanupFunctions.forEach(fn => fn && fn());
    videoManager.cleanup();
    
    delete section.dataset.scriptInitialized;
    delete section.dataset.introComplete;
    delete section.dataset.navigating;
  };
}