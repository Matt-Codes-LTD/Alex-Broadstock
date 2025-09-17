// assets/v1/sections/home-hero/index.js
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  const videoStage  = section.querySelector(".home-hero_video");
  const listParent  = section.querySelector(".home-hero_list_parent");
  const awardsStrip = section.querySelector(".home-awards_list");
  if (!videoStage || !listParent) { console.warn("[HomeHero] Missing required elements"); return () => {}; }

  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);

  let activeItem = null;
  let handoff = null;
  let revealedOnce = false;
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
    console.log("[HomeHero] Intro setup complete (no timelines)");
  }

  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  if (hasSiteLoader && !window.__barbaNavigated) {
    window.addEventListener("siteLoaderMorphBegin", async (e) => {
      handoff = e?.detail || null;
      console.log("[HomeHero] Handoff received:", handoff);
      
      // Pre-sync hero video to exact frame
      if (handoff?.src && handoff?.currentTime != null) {
        const heroVideo = videoManager.createVideo(handoff.src);
        if (heroVideo) {
          // Match exact time
          heroVideo.currentTime = handoff.currentTime;
          await heroVideo.play().catch(() => {});
          
          // Wait for frame sync if loader video provided
          if (handoff.loaderVideo) {
            await new Promise(resolve => {
              const syncFrames = () => {
                // Sync to loader's current time
                heroVideo.currentTime = handoff.loaderVideo.currentTime;
                
                if ('requestVideoFrameCallback' in heroVideo) {
                  heroVideo.requestVideoFrameCallback(() => resolve());
                } else {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => resolve());
                  });
                }
              };
              
              if (heroVideo.readyState >= 3) {
                syncFrames();
              } else {
                heroVideo.addEventListener('canplaythrough', syncFrames, { once: true });
              }
            });
          }
        }
      }
      
      initializeHero();
    }, { once: true });
  } else {
    initializeHero();
  }

  function updateAwards(item) {
    if (!awardsStrip) return;
    const awardsContainer = item?.querySelector(".home-project_awards");
    const newAwardImages = awardsContainer?.querySelectorAll("img") || [];
    awardsStrip.innerHTML = "";
    if (!newAwardImages.length) return awardsStrip.classList.remove("is-visible");
    newAwardImages.forEach(img => {
      const clone = img.cloneNode(true);
      clone.removeAttribute("sizes"); clone.removeAttribute("srcset");
      awardsStrip.appendChild(clone);
    });
    awardsStrip.classList.add("is-visible");
  }

  function setActive(item, opts = {}) {
    if (!item || item.style.display === "none") return;
    if (activeItem === item) return;

    activeItem = item;

    // Fade others
    items.forEach(i => {
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

    // Video
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc  = projectEl?.dataset.video;
    if (videoSrc) {
      const useHandoff = !!opts.useHandoff && handoff?.src && handoff.src === videoSrc;
      videoManager.setActive(videoSrc, activeLink, {
        startAt: useHandoff ? handoff.currentTime : undefined,
        mode: useHandoff ? "instant" : "tween",   // ← NO visual handover on first show
        onVisible: emitReadyOnce
      });
    }

    updateAwards(item);
  }

  function preloadVideos() {
    const MAX_EAGER = 3;
    let count = 0;
    items.forEach(item => {
      const projectEl = item.querySelector(".home-hero_item");
      const videoSrc  = projectEl?.dataset.video;
      if (videoSrc) {
        const video = videoManager.createVideo(videoSrc);
        if (video && count < MAX_EAGER) { videoManager.warmVideo(video); count++; }
      }
    });
  }

  function hideMetaTags() {
    section.querySelectorAll(".home-category_ref_text").forEach(tag => {
      const text = (tag.textContent || "").trim().toLowerCase();
      if (text === "selected") tag.setAttribute("hidden", "");
    });
  }

  // Interaction
  let hoverTimeout;
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item)) return;
    if (item.style.display !== "none") {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => setActive(item), 50);
    }
  }

  const cleanupFilter = initCategoryFilter(section, videoManager, () => {
    const firstItem = items.find(i => i.style.display !== "none");
    if (firstItem) setActive(firstItem);
  });

  listParent.addEventListener("mouseenter", handleInteraction, true);
  listParent.addEventListener("focusin", handleInteraction);
  listParent.addEventListener("touchstart", handleInteraction, { passive: true });
  listParent.addEventListener("click", handleInteraction);

  const handleVisibility = () => {
    if (document.hidden) {
      videoStage.querySelectorAll(".home-hero_video_el").forEach(v => v.pause?.());
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

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