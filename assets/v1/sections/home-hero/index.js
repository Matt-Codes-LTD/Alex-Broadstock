// assets/v1/sections/home-hero/index.js
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const videoStage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  const awardsStrip = section.querySelector(".home-awards_list");
  
  if (!videoStage || !listParent) return () => {};

  const links = Array.from(section.querySelectorAll(".home-hero_link"));
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);

  // Initialize awards display
  function updateAwards(item) {
    if (!awardsStrip) return;
    
    // Clear current awards
    awardsStrip.innerHTML = "";
    awardsStrip.classList.remove("is-visible");
    
    // Find awards in the active item
    const awardsContainer = item?.querySelector(".home-project_awards");
    if (!awardsContainer) return;
    
    const awardImages = awardsContainer.querySelectorAll("img");
    if (!awardImages.length) return;
    
    // Clone awards to strip
    awardImages.forEach(img => {
      const clone = img.cloneNode(true);
      clone.removeAttribute("sizes");
      clone.removeAttribute("srcset");
      awardsStrip.appendChild(clone);
    });
    
    // Fade in
    requestAnimationFrame(() => {
      awardsStrip.classList.add("is-visible");
    });
  }

  // Set active state
  function setActive(link) {
    const item = link.closest(".home-hero_list");
    const videoSrc = link.dataset.video;
    
    // Update link states
    links.forEach(l => {
      const isActive = l === link;
      l.setAttribute("aria-current", isActive ? "true" : "false");
      const text = l.querySelector(".home_hero_text");
      if (text) text.classList.toggle("u-color-faded", !isActive);
    });
    
    // Update category pills
    items.forEach(i => {
      const isActive = i === item;
      i.querySelectorAll(".home-category_ref_text:not([hidden])").forEach(pill => {
        pill.classList.toggle("u-color-faded", !isActive);
      });
    });
    
    // Update video
    if (videoSrc) videoManager.setActive(videoSrc, link);
    
    // Update awards
    updateAwards(item);
  }

  // Preload videos
  const MAX_EAGER = 3;
  links.forEach((link, i) => {
    const v = videoManager.createVideo(link.dataset.video);
    if (v && i < MAX_EAGER) videoManager.warmVideo(v);
  });

  // Initialize first visible
  const firstVisible = links.find(l => {
    const item = l.closest(".home-hero_list");
    return item && item.style.display !== "none";
  });
  if (firstVisible) setActive(firstVisible);

  // Hide "Selected" tags
  section.querySelectorAll(".home-category_ref_text").forEach(tag => {
    const text = (tag.textContent || "").trim().toLowerCase();
    if (text === "selected") tag.setAttribute("hidden", "");
  });

  // Initialize category filter with awards callback
  const cleanupFilter = initCategoryFilter(section, videoManager, (firstVisibleItem) => {
    if (firstVisibleItem) setActive(firstVisibleItem);
  });

  // Hover/focus handlers
  function onPointerOver(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item)) return;
    if (item.style.display !== "none") setActive(item);
  }

  listParent.addEventListener("pointerover", onPointerOver, { passive: true });
  listParent.addEventListener("focusin", onPointerOver);
  listParent.addEventListener("touchstart", onPointerOver, { passive: true });

  // Pause videos when tab hidden
  const visHandler = () => {
    if (document.hidden) {
      videoStage.querySelectorAll(".home-hero_video_el").forEach(v => v.pause?.());
    }
  };
  document.addEventListener("visibilitychange", visHandler);

  // CSS for awards
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

  // Cleanup
  return () => {
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    cleanupFilter?.();
    delete section.dataset.scriptInitialized;
  };
}