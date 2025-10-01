// index.js - Optimized hover handling with preloading
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

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
  
  const emitReadyOnce = () => {
    if (revealedOnce) return;
    revealedOnce = true;
    window.dispatchEvent(new CustomEvent("homeHeroReadyForReveal"));
  };

  function initializeHero() {
    hideMetaTags();
    preloadVideos();
    const firstVisible = items.find(item => item.style.display !== "none");
    if (firstVisible) setActive(firstVisible, { useHandoff: true });
    section.dataset.introComplete = "true";
    console.log("[HomeHero] Intro setup complete");
  }

  // Handle site loader handoff
  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  
  let morphListener = null;
  
  if (hasSiteLoader && window.__initialPageLoad) {
    morphListener = async (e) => {
      handoff = e?.detail || null;
      console.log("[HomeHero] Handoff received:", handoff);
      
      // Adopt the loader's video if it matches the first project
      if (handoff?.loaderVideo && handoff?.src) {
        const firstItem = items.find(i => i.style.display !== "none");
        const projectEl = firstItem?.querySelector(".home-hero_item");
        const videoSrc = projectEl?.dataset.video;
        
        if (videoSrc === handoff.src) {
          // CRITICAL: Adopt video (moves it from loader to hero stage)
          videoManager.adoptVideo(handoff.loaderVideo, videoSrc);
          handoff.isPreloaded = true;
          
          console.log("[HomeHero] Video adopted and moved to stage");
        }
      }
      
      // NOW safe to remove wrapper - video has been moved to hero stage
      if (handoff?.loaderWrapper) {
        handoff.loaderWrapper.remove();
        console.log("[HomeHero] Loader wrapper removed");
      }
      
      // Initialize hero with handoff
      initializeHero();
    };
    
    window.addEventListener("siteLoaderMorphBegin", morphListener, { once: true });
    cleanupFunctions.push(() => {
      if (morphListener) {
        window.removeEventListener("siteLoaderMorphBegin", morphListener);
      }
    });
  } else {
    // No loader - initialize immediately
    requestAnimationFrame(initializeHero);
  }

  function updateAwards(item) {
    if (!awardsStrip) return;
    const badges = item.querySelectorAll(".home-hero_award_ref");
    if (!badges.length) {
      awardsStrip.innerHTML = "";
      awardsStrip.classList.remove("is-visible");
      currentAwardsHTML = "";
      return;
    }
    const newHTML = Array.from(badges).map(b => b.innerHTML).join("");
    if (newHTML === currentAwardsHTML) return;
    currentAwardsHTML = newHTML;
    awardsStrip.innerHTML = "";
    const frag = document.createDocumentFragment();
    badges.forEach(badge => {
      const clone = badge.cloneNode(true);
      clone.removeAttribute("sizes");
      clone.removeAttribute("srcset");
      frag.appendChild(clone);
    });
    awardsStrip.appendChild(frag);
    awardsStrip.classList.add("is-visible");
  }

  function setActive(item, opts = {}) {
    if (!item || item.style.display === "none") return;
    if (activeItem === item && !opts.useHandoff) return;

    activeItem = item;

    // Batch DOM updates
    requestAnimationFrame(() => {
      // Fade others
      items.forEach(i => {
        if (i === item) return;
        const link  = i.querySelector(".home-hero_link");
        const text  = i.querySelector(".home_hero_text");
        const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");
        if (link) link.setAttribute("aria-current", "false");
        text?.classList.add("u-color-faded");
        pills.forEach(p => p.classList.add("u-color-faded"));
      });

      // Unfade active
      const activeLink  = item.querySelector(".home-hero_link");
      const activeText  = item.querySelector(".home_hero_text");
      const activePills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
      if (activeLink) activeLink.setAttribute("aria-current", "true");
      activeText?.classList.remove("u-color-faded");
      activePills.forEach(p => p.classList.remove("u-color-faded"));

      updateAwards(item);
    });

    // Video update
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc  = projectEl?.dataset.video;
    const activeLink = item.querySelector(".home-hero_link");
    
    if (videoSrc) {
      const useHandoff = !!opts.useHandoff && handoff?.src && handoff.src === videoSrc;
      
      // ALWAYS call setActive, even with handoff - just use instant mode
      videoManager.setActive(videoSrc, activeLink, {
        startAt: useHandoff ? handoff.currentTime : undefined,
        mode: useHandoff ? "instant" : "tween",
        onVisible: emitReadyOnce
      });
    }
  }

  function preloadVideos() {
    if (navigator.connection?.saveData) return;
    
    const MAX_EAGER = 3;
    let count = 0;
    
    items.forEach(item => {
      if (count >= MAX_EAGER) return;
      const projectEl = item.querySelector(".home-hero_item");
      const videoSrc  = projectEl?.dataset.video;
      if (videoSrc) {
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

  // IMPROVED: Hover-intent preloading
  function preloadVideoForItem(item) {
    if (navigator.connection?.saveData) return;
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;
    if (videoSrc) {
      const video = videoManager.getVideo(videoSrc) || videoManager.createVideo(videoSrc);
      if (video && !video.__warmed) {
        videoManager.warmVideo(video);
      }
    }
  }

  // IMPROVED: Better hover handling with preloading on intent
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item) || item.style.display === "none") return;
    
    // Clear existing timeouts
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    
    // Preload immediately on hover intent (before actual switch)
    preloadTimeout = setTimeout(() => {
      preloadVideoForItem(item);
    }, 50); // Preload after 50ms hover
    
    // Switch after slightly longer delay for smooth transitions
    hoverTimeout = setTimeout(() => setActive(item), 120); // Increased from 10ms
  }

  // Category filter
  const cleanupFilter = initCategoryFilter(section, videoManager, (firstItem) => {
    setActive(firstItem);
  });
  cleanupFunctions.push(cleanupFilter);

  // Event delegation for interactions
  listParent.addEventListener("mouseenter", handleInteraction, true);
  listParent.addEventListener("focusin", handleInteraction);
  listParent.addEventListener("touchstart", handleInteraction, { passive: true });
  listParent.addEventListener("click", handleInteraction);
  
  // Visibility handling
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

  // Cleanup
  return () => {
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    document.removeEventListener("visibilitychange", handleVisibility);
    
    cleanupFunctions.forEach(fn => fn && fn());
    videoManager.cleanup();
    
    delete section.dataset.scriptInitialized;
    delete section.dataset.introComplete;
  };
}