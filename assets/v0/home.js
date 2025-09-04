// home.js (modular + idempotent)
(function () {
  window.App = window.App || {};
  const NS = (window.App.home = window.App.home || {});

  function init(root = document) {
    const section = root.querySelector(".home-hero_wrap");
    if (!section || section.dataset.scriptInitialized) return;
    section.dataset.scriptInitialized = "1";

    const videos = section.querySelectorAll(".home-hero_video_el");
    const items = section.querySelectorAll(".home-hero_link");
    const categories = document.querySelectorAll(".home-category_text"); // global bar

    let activeVideo = section.querySelector(".home-hero_video_el.is-active");
    let debounceTimer;

    const setActiveVideo = (targetVideo, item) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        videos.forEach(v => v.classList.remove("is-active"));
        if (targetVideo) {
          targetVideo.classList.add("is-active");
          activeVideo = targetVideo;
        }
        // fade reset
        section.querySelectorAll(".home_hero_text, .home-category_ref_text")
          .forEach(el => el.classList.add("u-color-faded"));
        if (item) {
          item.querySelectorAll(".home_hero_text, .home-category_ref_text")
            .forEach(el => el.classList.remove("u-color-faded"));
        }
        categories.forEach(cat => cat.classList.add("u-color-faded"));
        const currentCategory = document.querySelector(".home-hero-category_wrap .home-category_text[aria-current='true']");
        if (currentCategory) currentCategory.classList.remove("u-color-faded");
      }, 100);
    };

    // initial state
    setActiveVideo(activeVideo, section.querySelector('.home-hero_link[aria-current="true"]'));

    // hover handlers (scoped to section)
    items.forEach(item => {
      item.addEventListener("mouseenter", () => {
        const videoSrc = item.dataset.video;
        if (!videoSrc) return;
        const file = videoSrc.split("/").pop();
        const target = [...videos].find(v => v.src.includes(file));
        setActiveVideo(target, item);
      });
    });
  }

  NS.init = init;
  NS.destroy = () => {}; // nothing global to clean up

  // direct-load support
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
