// index.js - Production version with autoplay sound signal and smooth transitions
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

export default function initHomeHero(container) {
  const section = container.querySelector(".home-hero_wrap");
  if (!section || section.dataset.scriptInitialized) return () => {};
  section.dataset.scriptInitialized = "true";

  delete section.dataset.navigating;

  const videoStage  = section.querySelector(".home-hero_video");
  const listParent  = section.querySelector(".home-hero_list_parent");
  const awardsStrip = section.querySelector(".home-awards_list");
  
  if (!videoStage || !listParent) { 
    console.warn("[HomeHero] Missing required elements"); 
    return () => {};
  }

  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);

  let activeItem = null;
  let handoff = null;
  let revealedOnce = false;
  let hoverTimeout = null;
  let preloadTimeout = null;
  let currentAwardsHTML = "";
  let cleanupFunctions = [];
  
  const emitReadyOnce = () => {
    if (revealedOnce) return;
    revealedOnce = true;
    window.dispatchEvent(new CustomEvent("homeHeroReadyForReveal"));
  };

  function initializeHero() {
    hideMetaTags();
    preloadVideos();
    
    if (window.gsap) {
      gsap.set(videoStage, { opacity: 1, zIndex: 0 });
    } else {
      videoStage.style.opacity = "1";
      videoStage.style.zIndex = "0";
    }
    
    const firstVisible = items.find(item => item.style.display !== "none");
    if (firstVisible) setActive(firstVisible, { useHandoff: true });
    section.dataset.introComplete = "true";
  }

  const hasSiteLoader = document.querySelector(".site-loader_wrap");
  let morphListener = null;
  
  if (hasSiteLoader && window.__initialPageLoad) {
    morphListener = async (e) => {
      handoff = e?.detail || null;
      await new Promise(resolve => setTimeout(resolve, 100));
      initializeHero();
    };
    window.addEventListener("siteLoaderMorphBegin", morphListener, { once: true });
  } else {
    requestAnimationFrame(() => initializeHero());
  }

  // ✨ SMOOTH AWARDS TRANSITION (UPDATED)
  function updateAwards(item) {
    if (!awardsStrip) return;
    const list = item.querySelector(".home-awards_list");
    if (!list) return;

    const newHTML = list.innerHTML;
    if (newHTML === currentAwardsHTML) return;
    
    currentAwardsHTML = newHTML;
    
    // Smooth transition for awards
    if (window.gsap) {
      const items = awardsStrip.querySelectorAll(":scope > *");
      
      gsap.to(items, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: "power2.in",
        stagger: 0.02,
        onComplete: () => {
          awardsStrip.innerHTML = newHTML;
          const newItems = awardsStrip.querySelectorAll(":scope > *");
          
          gsap.fromTo(newItems, {
            opacity: 0,
            y: 10
          }, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.03,
            delay: 0.1
          });
        }
      });
    } else {
      awardsStrip.innerHTML = newHTML;
    }
  }

  // ✨ SMOOTH TEXT TRANSITIONS (UPDATED)
  function setActive(item, opts = {}) {
    if (!item || item === activeItem) return;
    
    const previousItem = activeItem;
    activeItem = item;

    // Animate text transitions
    if (window.gsap && previousItem !== item) {
      const prevText = previousItem?.querySelector(".home_hero_text");
      const prevPills = previousItem?.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      const nextText = item.querySelector(".home_hero_text");
      const nextPills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      // Fade out previous (if exists)
      if (prevText) {
        gsap.to(prevText, {
          opacity: 0,
          x: -15,
          duration: 0.25,
          ease: "power2.in"
        });
      }
      if (prevPills.length) {
        gsap.to(prevPills, {
          opacity: 0,
          x: 10,
          duration: 0.25,
          ease: "power2.in",
          stagger: 0.02
        });
      }
      
      // Fade in new
      gsap.fromTo(nextText, {
        opacity: 0,
        x: -30,
        filter: "blur(4px)"
      }, {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.4,
        delay: 0.15,
        ease: "power2.out"
      });
      
      gsap.fromTo(nextPills, {
        opacity: 0,
        x: 20
      }, {
        opacity: 1,
        x: 0,
        duration: 0.35,
        delay: 0.2,
        ease: "power2.out",
        stagger: 0.03
      });
    }

    requestAnimationFrame(() => {
      items.forEach((i) => {
        const link  = i.querySelector(".home-hero_link");
        const text  = i.querySelector(".home_hero_text");
        const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");
        if (link) link.setAttribute("aria-current", "false");
        if (!window.gsap) {
          text?.classList.add("u-color-faded");
          pills.forEach(p => p.classList.add("u-color-faded"));
        }
      });

      const activeLink  = item.querySelector(".home-hero_link");
      const activeText  = item.querySelector(".home_hero_text");
      const activePills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
      if (activeLink) activeLink.setAttribute("aria-current", "true");
      if (!window.gsap) {
        activeText?.classList.remove("u-color-faded");
        activePills.forEach(p => p.classList.remove("u-color-faded"));
      }

      updateAwards(item);
    });

    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc  = projectEl?.dataset.video;
    const activeLink = item.querySelector(".home-hero_link");
    
    if (videoSrc) {
      const useHandoff = !!opts.useHandoff && handoff?.src && handoff.src === videoSrc;
      
      videoManager.setActive(videoSrc, activeLink, {
        mode: useHandoff ? "instant" : "tween",
        onVisible: emitReadyOnce
      });
    }
  }

  function preloadVideos() {
    if (navigator.connection?.saveData) return;
    
    const MAX_EAGER = 3;
    let count = 0;
    
    items.forEach(item => {
      if (count >= MAX_EAGER) return;
      const projectEl = item.querySelector(".home-hero_item");
      const videoSrc  = projectEl?.dataset.video;
      if (videoSrc) {
        const video = videoManager.createVideo(videoSrc);
        if (video) {
          videoManager.warmVideo(video);
          count++;
        }
      }
    });
  }

  function hideMetaTags() {
    section.querySelectorAll(".home-category_ref_text").forEach(tag => {
      const text = (tag.textContent || "").trim().toLowerCase();
      if (text === "selected") tag.setAttribute("hidden", "");
    });
  }

  function preloadVideoForItem(item) {
    if (navigator.connection?.saveData) return;
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;
    if (videoSrc) {
      const video = videoManager.getVideo(videoSrc) || videoManager.createVideo(videoSrc);
      if (video) {
        video.__keepAlive = true;
        if (!video.__warmed) {
          videoManager.warmVideo(video);
        }
        if (video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  }

  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item) || item.style.display === "none") return;
    
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    
    preloadTimeout = setTimeout(() => {
      preloadVideoForItem(item);
    }, 50);
    
    hoverTimeout = setTimeout(() => setActive(item), 120);
  }

  // Signal autoplay sound intent on click (using correct class name)
  function handleClick(e) {
    // FIX: Use .home-hero_url (the actual class in your HTML)
    const link = e.target.closest(".home-hero_url");
    
    if (link && !section.dataset.navigating) {
      sessionStorage.setItem("pp:autoplay-sound", "1");
    }
  }

  const cleanupFilter = initCategoryFilter(section, videoManager, (firstItem) => {
    setActive(firstItem);
  });
  cleanupFunctions.push(cleanupFilter);

  listParent.addEventListener("mouseenter", handleInteraction, true);
  listParent.addEventListener("focusin", handleInteraction);
  listParent.addEventListener("touchstart", handleInteraction, { passive: true });
  listParent.addEventListener("click", handleInteraction);
  listParent.addEventListener("click", handleClick, true);
  
  const handleVisibility = () => {
    if (document.hidden) {
      videoStage.querySelectorAll(".home-hero_video_el").forEach(v => {
        try { v.pause(); } catch {}
      });
    } else if (activeItem) {
      const projectEl = activeItem.querySelector(".home-hero_item");
      const videoSrc = projectEl?.dataset.video;
      if (videoSrc) {
        const video = videoManager.getVideo(videoSrc);
        if (video && video.paused) {
          video.play().catch(() => {});
        }
      }
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    clearTimeout(hoverTimeout);
    clearTimeout(preloadTimeout);
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    listParent.removeEventListener("click", handleClick, true);
    document.removeEventListener("visibilitychange", handleVisibility);
    
    if (morphListener) {
      window.removeEventListener("siteLoaderMorphBegin", morphListener);
    }
    
    cleanupFunctions.forEach(fn => fn && fn());
    videoManager.cleanup();
    
    delete section.dataset.scriptInitialized;
    delete section.dataset.introComplete;
    delete section.dataset.navigating;
  };
}