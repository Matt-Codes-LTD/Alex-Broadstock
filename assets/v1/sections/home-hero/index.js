import { createVideoManager } from "./video-manager.js";
import { applyFilterFLIP } from "./category-filter.js";
import { normalize, prefersReducedMotion } from "./utils.js";


export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const stage = section.querySelector(".home-hero_video");
  const listParent = section.querySelector(".home-hero_list_parent");
  if (!stage || !listParent) return () => {};

  const links = Array.from(section.querySelectorAll(".home-hero_link"));
  const videoManager = createVideoManager(stage, prefersReducedMotion, prefersReducedData);

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

  // Category buttons
  const catWrap = document.querySelector(".home_hero_categories");
  function setActiveCat(label) {
    const key = normalize(label);
    catWrap.querySelectorAll(".home-category_text").forEach((b) => {
      const isActive = normalize(b.textContent) === key;
      b.setAttribute("aria-current", isActive ? "true" : "false");
      b.classList.toggle("u-color-faded", !isActive);
    });
  }
  function onClick(e) {
    const btn = e.target.closest(".home-category_text");
    if (!btn || !catWrap.contains(btn)) return;
    e.preventDefault();
    const label = btn.textContent || "All";
    setActiveCat(label);
    applyFilterFLIP(section, label, videoManager, prefersReducedMotion);
  }
  catWrap?.addEventListener("click", onClick, { passive: false });
  section.__catCleanup = () => catWrap?.removeEventListener("click", onClick);

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
    section.__catCleanup?.();
    delete section.dataset.scriptInitialized;
  };
}
