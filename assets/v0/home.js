window.homeInit = () => {
  const videos = document.querySelectorAll(".home-hero_video_el");
  const items = document.querySelectorAll(".home-hero_link");
  const categories = document.querySelectorAll(".home-category_text");

  let activeVideo = document.querySelector(".home-hero_video_el.is-active");
  let debounceTimer;

  function setActiveVideo(targetVideo, item) {
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      videos.forEach(v => v.classList.remove("is-active"));
      if (targetVideo) {
        targetVideo.classList.add("is-active");
        activeVideo = targetVideo;
      }

      document.querySelectorAll(".home_hero_text, .home-category_ref_text")
        .forEach(el => el.classList.add("u-color-faded"));

      if (item) {
        item.querySelectorAll(".home_hero_text, .home-category_ref_text")
          .forEach(el => el.classList.remove("u-color-faded"));
      }

      categories.forEach(cat => cat.classList.add("u-color-faded"));
      const currentCategory = document.querySelector(
        ".home-hero-category_wrap .home-category_text[aria-current='true']"
      );
      if (currentCategory) currentCategory.classList.remove("u-color-faded");
    }, 100);
  }

  setActiveVideo(activeVideo, document.querySelector(".home-hero_link[aria-current='true']"));

  items.forEach(item => {
    item.addEventListener("mouseenter", () => {
      const videoSrc = item.dataset.video;
      const targetVideo = [...videos].find(v => v.src.includes(videoSrc.split("/").pop()));
      setActiveVideo(targetVideo, item);
    });
  });
};

// Run immediately if loaded on direct page hit
if (document.querySelector(".home-hero_wrap")) window.homeInit();
