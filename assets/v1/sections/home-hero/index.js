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

  // Awards management
  function updateAwards(item) {
    if (!awardsStrip) return;
    
    awardsStrip.innerHTML = "";
    awardsStrip.classList.remove("is-visible");
    
    const awardsContainer = item?.querySelector(".home-project_awards");
    if (!awardsContainer) return;
    
    const awardImages = awardsContainer.querySelectorAll("img");
    if (!awardImages.length) return;
    
    awardImages.forEach(img => {
      const clone = img.cloneNode(true);
      clone.removeAttribute("sizes");
      clone.removeAttribute("srcset");
      awardsStrip.appendChild(clone);
    });
    
    requestAnimationFrame(() => {
      awardsStrip.classList.add("is-visible");
    });
  }

  // Set active project
  function setActive(item) {
    if (!item || item.style.display === "none") return;
    if (activeItem === item) return;
    
    activeItem = item;
    
    // Get video from .home-hero_item element
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;
    
    // Update all items' states
    items.forEach(i => {
      const isActive = i === item;
      const link = i.querySelector(".home-hero_link");
      const text = i.querySelector(".home_hero_text");
      
      // Update link state
      if (link) {
        link.setAttribute("aria-current", isActive ? "true" : "false");
      }
      
      // Update text color
      if (text) {
        text.classList.toggle("u-color-faded", !isActive);
      }
      
      // Update category pills
      i.querySelectorAll(".home-category_ref_text:not([hidden])").forEach(pill => {
        pill.classList.toggle("u-color-faded", !isActive);
      });
    });
    
    // Trigger video change
    if (videoSrc && videoManager) {
      // Create a pseudo-link object for compatibility with video-manager
      const pseudoLink = { 
        dataset: { video: videoSrc },
        getAttribute: () => videoSrc
      };
      videoManager.setActive(videoSrc, pseudoLink);
    }
    
    // Update awards
    updateAwards(item);
  }

  // Preload videos
  function preloadVideos() {
    const MAX_EAGER = 3;
    let count = 0;
    
    items.forEach(item => {
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
      if (text === "selected" || text === "archive") {
        tag.setAttribute("hidden", "");
      }
    });
  }

  // Event handlers
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item)) return;
    if (item.style.display !== "none") {
      setActive(item);
    }
  }

  // Initialize category filter with callback
  const cleanupFilter = initCategoryFilter(section, videoManager, (firstVisible) => {
    // After filter, set first visible item as active
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

  // Add required CSS
  if (!section.querySelector("[data-awards-css]")) {
    const style = document.createElement("style");
    style.setAttribute("data-awards-css", "");
    style.textContent = `
      .home-awards_list {
        opacity: 0;
        transition: opacity .3s ease;
      }
      .home-awards_list.is-visible {
        opacity: 1;
      }
      .home-awards_list img {
        height: 4rem;
        width: auto;
        display: block;
      }
    `;
    section.appendChild(style);
  }

  // Initialize
  hideMetaTags();
  preloadVideos();
  
  // Set first visible item as active
  const firstVisible = items.find(item => item.style.display !== "none");
  if (firstVisible) {
    setActive(firstVisible);
  }

  // Cleanup function
  return () => {
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    document.removeEventListener("visibilitychange", handleVisibility);
    cleanupFilter?.();
    delete section.dataset.scriptInitialized;
  };
}