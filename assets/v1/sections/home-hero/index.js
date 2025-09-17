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

  // Initialize
  function initializeHero(skipFirstVideo = false) {
    hideMetaTags();
    
    // Only preload if we didn't adopt a loader video
    if (!skipFirstVideo) {
      preloadVideos();
      const firstVisible = items.find(item => item.style.display !== "none");
      if (firstVisible) setActive(firstVisible);
    }

    section.dataset.introComplete = "true";
    console.log("[HomeHero] Init complete");
  }

  // Listen for site loader handoff
  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  if (hasSiteLoader && !window.__barbaNavigated) {
    window.addEventListener(
      "siteLoaderMorphComplete",
      (event) => {
        console.log("[HomeHero] Receiving video from loader");
        
        if (event.detail && event.detail.video) {
          const video = event.detail.video;
          const videoSrc = event.detail.currentSrc;
          
          // The video should already be in our container
          if (videoStage.contains(video)) {
            console.log("[HomeHero] Video successfully transferred");
            
            // Register it with video manager
            videoManager.registerExistingVideo(videoSrc, video);
            loaderVideoAdopted = true;
            
            // Set first project as active without restarting video
            const firstVisible = items.find(item => item.style.display !== "none");
            if (firstVisible) {
              const linkEl = firstVisible.querySelector(".home-hero_link");
              if (linkEl) {
                linkEl.dataset.video = videoSrc;
                // Update active states without video change
                activeItem = firstVisible;
                updateActiveStates(firstVisible);
                updateAwards(firstVisible);
                videoManager.setActiveLink(linkEl);
              }
            }
            
            // Preload other videos after a delay
            setTimeout(() => preloadVideos(true), 1000);
          }
        }
        
        initializeHero(loaderVideoAdopted);
      },
      { once: true }
    );
  } else {
    // No loader, initialize immediately
    initializeHero();
  }

  // Awards management
  function updateAwards(item) {
    if (!awardsStrip) return;

    const awardsContainer = item?.querySelector(".home-project_awards");
    const newAwardImages = awardsContainer?.querySelectorAll("img") || [];

    awardsStrip.innerHTML = "";

    if (!newAwardImages.length) {
      awardsStrip.classList.remove("is-visible");
      return;
    }

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
    items.forEach(i => {
      const link = i.querySelector(".home-hero_link");
      const text = i.querySelector(".home_hero_text");
      const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");

      if (link) link.setAttribute("aria-current", "false");
      text?.classList.add("u-color-faded");
      pills.forEach(p => p.classList.add("u-color-faded"));
    });

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

    updateAwards(item);
  }

  // Preload videos
  function preloadVideos(skipFirst = false) {
    const MAX_EAGER = 3;
    let count = skipFirst ? 1 : 0;

    items.forEach((item, index) => {
      if (skipFirst && index === 0) return;
      
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

  // Event handlers with debouncing
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