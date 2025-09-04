// https://alex-static-cdn.b-cdn.net/assets/live/v0/home.js
(function () {
  function HomeInit(container) {
    const root = (container || document).querySelector('.home-hero_wrap');
    if (!root || root.dataset.scriptInitialized) return;
    root.dataset.scriptInitialized = '1';

    const videos = root.querySelectorAll('.home-hero_video_el');
    const items  = root.querySelectorAll('.home-hero_link');
    const categories = (container || document).querySelectorAll('.home-category_text');

    let activeVideo = root.querySelector('.home-hero_video_el.is-active') || videos[0];
    let debounceTimer;

    function setActiveVideo(targetVideo, item) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        videos.forEach(v => v.classList.remove('is-active'));
        if (targetVideo) {
          targetVideo.classList.add('is-active');
          activeVideo = targetVideo;
        }
        // fade states (scoped)
        root.querySelectorAll('.home_hero_text, .home-category_ref_text')
          .forEach(el => el.classList.add('u-color-faded'));
        if (item) {
          item.querySelectorAll('.home_hero_text, .home-category_ref_text')
            .forEach(el => el.classList.remove('u-color-faded'));
        }
        categories.forEach(cat => cat.classList.add('u-color-faded'));
        const currentCategory = (container || document)
          .querySelector('.home-hero-category_wrap .home-category_text[aria-current="true"]');
        if (currentCategory) currentCategory.classList.remove('u-color-faded');
      }, 100);
    }

    // Init
    setActiveVideo(activeVideo, root.querySelector('.home-hero_link[aria-current="true"]'));

    // Hover -> change active video
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        const videoSrc = item.dataset.video;
        if (!videoSrc) return;
        const file = videoSrc.split('/').pop();
        const targetVideo = [...videos].find(v => v.src.includes(file));
        setActiveVideo(targetVideo, item);
      });
    });
  }

  // expose globally
  window.HomeInit = HomeInit;
})();
