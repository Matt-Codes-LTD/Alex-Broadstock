import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const stage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  if (!stage || !listParent) return () => {};

  // Update selector to find home-hero_item instead of home-hero_link
  const items = Array.from(section.querySelectorAll(".home-hero_item"));
  const videoManager = createVideoManager(stage);

  // Preload eager videos
  const MAX_EAGER = Number(section.getAttribute("data-warm-eager") || 3);
  items.forEach((item, i) => {
    const v = videoManager.createVideo(item.dataset.video);
    if (v) {
      i < MAX_EAGER
        ? videoManager.warmVideo(v)
        : (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() =>
            videoManager.warmVideo(v)
          );
    }
  });

  // Init first video
  if (items.length) {
    const first = items[0];
    videoManager.createVideo(first.dataset.video);
    videoManager.setActive(first.dataset.video, first);
  }

  // ✅ Single call for categories
  const cleanupCat = initCategoryFilter(section, videoManager);

  // Hover/focus videos - updated to use home-hero_item
  function onPointerOver(e) {
    const item = e.target.closest?.(".home-hero_item");
    if (!item || !listParent.contains(item)) return;
    videoManager.setActive(item.dataset.video, item);
  }
  
  // ADD THIS: Mark project clicks to skip FLIP animation
  function onProjectClick(e) {
    const projectUrl = e.target.closest(".home-hero_url");
    const categoryBtn = e.target.closest(".home-category_text");
    
    // Only mark as navigating if it's a project link, not a category button
    if (projectUrl && !categoryBtn) {
      section.dataset.navigating = "true";
      // Longer timeout to ensure FLIP doesn't trigger during Barba init
      setTimeout(() => delete section.dataset.navigating, 500);
    }
  }
  
  listParent.addEventListener("click", onProjectClick, { capture: true });
  listParent.addEventListener("pointerover", onPointerOver, { passive: true });
  listParent.addEventListener("focusin", onPointerOver);
  listParent.addEventListener("touchstart", onPointerOver, { passive: true });

  const visHandler = () => {
    if (document.hidden)
      stage.querySelectorAll(".home-hero_video_el").forEach((v) => v.pause?.());
  };
  document.addEventListener("visibilitychange", visHandler);

  // Cleanup
  return () => {
    listParent.removeEventListener("click", onProjectClick, { capture: true });
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    cleanupCat?.();
    delete section.dataset.scriptInitialized;
  };
}