// assets/v1/sections/home-hero/index.js
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  // Core elements
  const videoStage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  const awardsStrip = section.querySelector(".home-awards_list");

  if (!videoStage || !listParent) {
    console.warn("[HomeHero] Missing required elements");
    return () => {};
  }

  // Get all project items
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);

  // Track active item
  let activeItem = null;
  let loaderVideoAdopted = false;

  // Initialize (no timelines)
  function initializeHero() {
    hideMetaTags();
    
    // Only preload if we didn't adopt a loader video
    if (!loaderVideoAdopted) {
      preloadVideos();
      const firstVisible = items.find(item => item.style.display !== "none");
      if (firstVisible) setActive(firstVisible);
    }

    section.dataset.introComplete = "true";
    console.log("[HomeHero] Intro setup complete (no timelines)");
  }

  // Wait for site loader morph if present, then init
  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  if (hasSiteLoader && !window.__barbaNavigated) {
    window.addEventListener(
      "siteLoaderMorphComplete",
      (event) => {
        console.log("[HomeHero] Morph complete, checking for loader video");
        
        // Adopt the loader's video if provided
        if (event.detail && event.detail.video) {
          const loaderVideo = event.detail.video;
          const loaderSrc = event.detail.currentSrc;
          
          console.log("[HomeHero] Adopting loader video:", loaderSrc);
          
          // The video should already be in our container from the loader
          if (!videoStage.contains(loaderVideo)) {
            console.warn("[HomeHero] Video not found in container, this shouldn't happen");
            videoStage.appendChild(loaderVideo);
          }
          
          // Register it with video manager
          videoManager.adoptVideo(loaderSrc, loaderVideo);
          loaderVideoAdopted = true;
          
          // Set first project as active without video restart
          const firstVisible = items.find(item => item.style.display !== "none");
          if (firstVisible) {
            const linkEl = firstVisible.querySelector(".home-hero_link");
            const projectEl = firstVisible.querySelector(".home-hero_item");
            
            if (linkEl && projectEl) {
              // Update the link's data-video to match
              linkEl.dataset.video = loaderSrc;
              
              // Set as active without restarting
              videoManager.setActiveWithoutRestart(loaderSrc, linkEl);
              
              // Update UI state
              activeItem = firstVisible;
              updateActiveStates(firstVisible);
              updateAwards(firstVisible);
            }
          }
          
          // Preload other videos in background
          setTimeout(() => preloadVideos(true), 1000);
        }
        
        initializeHero();
      },
      { once: true }
    );
  } else {
    initializeHero();
  }

  // Awards management (no timelines/animations)
  function updateAwards(item) {
    if (!awardsStrip) return;

    const awardsContainer = item?.querySelector(".home-project_awards");
    const newAwardImages = awardsContainer?.querySelectorAll("img") || [];

    // Clear existing
    awardsStrip.innerHTML = "";

    if (!newAwardImages.length) {
      awardsStrip.classList.remove("is-visible");
      return;
    }

    // Add new awards instantly
    newAwardImages.forEach(img => {
      const clone = img.cloneNode(true);
      clone.removeAttribute("sizes");
      clone.removeAttribute("srcset");
      awardsStrip.appendChild(clone);
    });

    awardsStrip.classList.add("is-visible");
  }

  // Update UI states for active project
  function updateActiveStates(item) {
    // Apply faded class to all items first
    items.forEach(i => {
      const link = i.querySelector(".home-hero_link");
      const text = i.querySelector(".home_hero_text");
      const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");

      if (link) link.setAttribute("aria-current", "false");
      text?.classList.add("u-color-faded");
      pills.forEach(p => p.classList.add("u-color-faded"));
    });

    // Unfade active
    const activeLink = item.querySelector(".home-hero_link");
    const activeText = item.querySelector(".home_hero_text");
    const activePills = item.querySelectorAll(".home-category_ref_text:not([hidden])");

    if (activeLink) activeLink.setAttribute("aria-current", "true");
    activeText?.classList.remove("u-color-faded");
    activePills.forEach(p => p.classList.remove("u-color-faded"));
  }

  // Set active project
  function setActive(item) {
    if (!item || item.style.display === "none") return;
    if (activeItem === item) return;

    activeItem = item;

    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;

    updateActiveStates(item);

    // Trigger video change
    if (videoSrc && videoManager) {
      const linkEl = item.querySelector(".home-hero_link");
      if (linkEl) {
        linkEl.dataset.video = videoSrc;
        videoManager.setActive(videoSrc, linkEl);
      }
    }

    // Update awards (no animation)
    updateAwards(item);
  }

  // Preload videos (skip first if adopted from loader)
  function preloadVideos(skipFirst = false) {
    const MAX_EAGER = 3;
    let count = skipFirst ? 1 : 0; // Skip first if we adopted it

    items.forEach((item, index) => {
      if (skipFirst && index === 0) return; // Skip first video if adopted
      
      const projectEl = item.querySelector(".home-hero_item");
      const videoSrc = projectEl?.dataset.video;

      if (videoSrc && videoManager) {
        const video = videoManager.createVideo(videoSrc);
        if (video && count < MAX_EAGER) {
          videoManager.warmVideo(video);
          count++;
        }
      }
    });
  }

  // Hide "Selected" tags
  function hideMetaTags() {
    section.querySelectorAll(".home-category_ref_text").forEach(tag => {
      const text = (tag.textContent || "").trim().toLowerCase();
      if (text === "selected") tag.setAttribute("hidden", "");
    });
  }

  // Improved event handlers with debouncing
  let hoverTimeout;
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item)) return;
    if (item.style.display !== "none") {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => setActive(item), 50);
    }
  }

  // Initialize category filter
  const cleanupFilter = initCategoryFilter(section, videoManager, () => {
    const firstItem = items.find(i => i.style.display !== "none");
    if (firstItem) setActive(firstItem);
  });

  // Bind events
  listParent.addEventListener("mouseenter", handleInteraction, true);
  listParent.addEventListener("focusin", handleInteraction);
  listParent.addEventListener("touchstart", handleInteraction, { passive: true });
  listParent.addEventListener("click", handleInteraction);

  // Handle tab visibility
  const handleVisibility = () => {
    if (document.hidden) {
      videoStage.querySelectorAll(".home-hero_video_el").forEach(v => v.pause?.());
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  // Cleanup function
  return () => {
    clearTimeout(hoverTimeout);
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    document.removeEventListener("visibilitychange", handleVisibility);
    cleanupFilter?.();
    delete section.dataset.scriptInitialized;
    delete section.dataset.introComplete;
  };
}