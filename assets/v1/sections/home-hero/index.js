import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const stage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  if (!stage || !listParent) return () => {};

  const links = Array.from(section.querySelectorAll(".home-hero_link"));
  const videoManager = createVideoManager(stage);

  // Preload eager videos
  const MAX_EAGER = Number(section.getAttribute("data-warm-eager") || 3);
  links.forEach((lnk, i) => {
    const v = videoManager.createVideo(lnk.dataset.video);
    if (v) {
      i < MAX_EAGER
        ? videoManager.warmVideo(v)
        : (window.requestIdleCallback || ((fn) => setTimeout(fn, 400)))(() =>
            videoManager.warmVideo(v)
          );
    }
  });

  // Init first video
  if (links.length) {
    const first = links[0];
    videoManager.createVideo(first.dataset.video);
    videoManager.setActive(first.dataset.video, first);
  }

  // ✅ Single call for categories
  const cleanupCat = initCategoryFilter(section, videoManager);

  // Hover/focus videos
  function onPointerOver(e) {
    const a = e.target.closest?.(".home-hero_link");
    if (!a || !listParent.contains(a)) return;
    videoManager.setActive(a.dataset.video, a);
  }
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
    listParent.removeEventListener("pointerover", onPointerOver);
    listParent.removeEventListener("focusin", onPointerOver);
    listParent.removeEventListener("touchstart", onPointerOver);
    document.removeEventListener("visibilitychange", visHandler);
    cleanupCat?.();
    delete section.dataset.scriptInitialized;
  };
}
