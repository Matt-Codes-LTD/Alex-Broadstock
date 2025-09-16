// assets/v1/sections/home-hero/index.js
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

/**
 * Create intro animation timeline
 */
function createIntroAnimation(section) {
  // Set initial states via GSAP
  gsap.set([
    ".home-category_text",
    ".home_hero_text", 
    ".home-category_ref_text:not([hidden])",
    ".brand_logo",
    ".nav_link",
    ".home-awards_list"
  ], {
    opacity: 0,
    y: 20,
    scale: 0.98
  });
  
  // Hide video initially for smoother transition
  gsap.set(".home-hero_video_el", {
    opacity: 0
  });

  // Create master timeline
  const tl = gsap.timeline({
    defaults: {
      ease: "power3.out",
      duration: 0.8
    },
    onComplete: () => {
      console.log("[HomeHero] Intro animation complete");
      section.dataset.introComplete = "true";
      
      // Remove inline styles to let CSS take over
      gsap.set([
        ".home-category_text",
        ".home_hero_text",
        ".home-category_ref_text",
        ".brand_logo",
        ".nav_link"
      ], { clearProps: "all" });
    }
  });

  // Phase 1: Logo and Nav
  tl.to(".brand_logo", {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 1,
    ease: "power4.out"
  }, 0.2)
  
  // Navigation links with micro-stagger
  .to(".nav_link", {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    stagger: 0.08
  }, 0.3)
  
  // Phase 2: Category filters
  .to(".home-category_text", {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    stagger: {
      each: 0.06,
      from: "start"
    }
  }, 0.4)
  
  // Phase 3: Project names
  .to(".home_hero_text", {
    opacity: function(index, target) {
      const parent = target.closest('.home-hero_link');
      return parent?.getAttribute('aria-current') === 'true' ? 1 : 0.6;
    },
    y: 0,
    scale: 1,
    duration: 0.7,
    stagger: {
      each: 0.05,
      from: "start",
      ease: "power2.inOut"
    }
  }, 0.6)
  
  // Phase 4: Project tags
  .to(".home-category_ref_text:not([hidden])", {
    opacity: function(index, target) {
      const parent = target.closest('.home-hero_link');
      return parent?.getAttribute('aria-current') === 'true' ? 1 : 0.6;
    },
    y: 0,
    scale: 1,
    duration: 0.6,
    stagger: {
      each: 0.04,
      from: "start"
    }
  }, 0.7)
  
  // Phase 5: Awards (if visible)
  .to(".home-awards_list", {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.8,
    ease: "back.out(1.4)"
  }, 0.9)
  
  // Phase 6: Video fade in
  .to(".home-hero_video_el.is-active", {
    opacity: 1,
    duration: 1.5,
    ease: "power2.inOut"
  }, 0.5);

  return tl;
}

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

  // Run intro animation first
  const introTimeline = createIntroAnimation(section);

  // Get all project items
  const items = Array.from(section.querySelectorAll(".home-hero_list"));
  const videoManager = createVideoManager(videoStage);
  
  // Track active item
  let activeItem = null;
  let isTransitioning = false;

  // Improved awards management with GSAP
  function updateAwards(item) {
    if (!awardsStrip || isTransitioning) return;
    isTransitioning = true;
    
    const awardsContainer = item?.querySelector(".home-project_awards");
    const newAwardImages = awardsContainer?.querySelectorAll("img") || [];
    
    // Create timeline for smooth transition
    const tl = gsap.timeline({
      onComplete: () => {
        isTransitioning = false;
      }
    });

    // If no awards, just fade out
    if (!newAwardImages.length) {
      tl.to(awardsStrip, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      })
      .call(() => {
        awardsStrip.innerHTML = "";
        awardsStrip.classList.remove("is-visible");
      });
      return;
    }

    // Fade out current awards
    tl.to(awardsStrip, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.out"
    })
    // Clear and add new awards
    .call(() => {
      awardsStrip.innerHTML = "";
      
      newAwardImages.forEach(img => {
        const clone = img.cloneNode(true);
        clone.removeAttribute("sizes");
        clone.removeAttribute("srcset");
        gsap.set(clone, { 
          opacity: 0, 
          y: 12,
          scale: 0.95
        });
        awardsStrip.appendChild(clone);
      });
      
      awardsStrip.classList.add("is-visible");
    })
    // Fade in and animate new awards
    .to(awardsStrip, {
      opacity: 1,
      duration: 0.4,
      ease: "power2.out"
    }, "+=0.1")
    .to(awardsStrip.querySelectorAll("img"), {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.08,
      ease: "back.out(1.7)"
    }, "-=0.3");
  }

  // Set active project with improved transitions
  function setActive(item) {
    if (!item || item.style.display === "none") return;
    if (activeItem === item) return;
    
    const prevItem = activeItem;
    activeItem = item;
    
    // Get video from .home-hero_item element
    const projectEl = item.querySelector(".home-hero_item");
    const videoSrc = projectEl?.dataset.video;
    
    // Apply faded class to all items first
    items.forEach(i => {
      const link = i.querySelector(".home-hero_link");
      const text = i.querySelector(".home_hero_text");
      const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");
      
      if (link) link.setAttribute("aria-current", "false");
      
      // Add faded class to all
      text?.classList.add("u-color-faded");
      pills.forEach(p => p.classList.add("u-color-faded"));
    });
    
    // Remove faded class from active item
    const activeLink = item.querySelector(".home-hero_link");
    const activeText = item.querySelector(".home_hero_text");
    const activePills = item.querySelectorAll(".home-category_ref_text:not([hidden])");
    
    if (activeLink) {
      activeLink.setAttribute("aria-current", "true");
    }
    
    // Remove faded class from active elements
    activeText?.classList.remove("u-color-faded");
    activePills.forEach(p => p.classList.remove("u-color-faded"));
    
    // Trigger video change with crossfade
    if (videoSrc && videoManager) {
      const linkEl = item.querySelector(".home-hero_link");
      if (linkEl) {
        linkEl.dataset.video = videoSrc;
        videoManager.setActive(videoSrc, linkEl);
      }
    }
    
    // Update awards with delay for better sequencing
    setTimeout(() => updateAwards(item), 150);
  }

  // Preload videos (delayed to prioritize intro animation)
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
      if (text === "selected") {
        tag.setAttribute("hidden", "");
      }
    });
  }

  // Improved event handlers with debouncing
  let hoverTimeout;
  function handleInteraction(e) {
    const item = e.target.closest(".home-hero_list");
    if (!item || !listParent.contains(item)) return;
    if (item.style.display !== "none") {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => setActive(item), 50);
    }
  }

  // Initialize category filter
  const cleanupFilter = initCategoryFilter(section, videoManager, (firstVisible) => {
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

  // Note: All CSS should be in your main CSS file/embed
  // The GSAP animations will handle the initial states and animations

  // Initialize after intro animation has started
  introTimeline.eventCallback("onStart", () => {
    hideMetaTags();
  });

  // Complete initialization after intro plays
  introTimeline.eventCallback("onComplete", () => {
    preloadVideos();
    
    // Set first visible item as active
    const firstVisible = items.find(item => item.style.display !== "none");
    if (firstVisible) {
      setActive(firstVisible);
    }
  });

  // Cleanup function
  return () => {
    clearTimeout(hoverTimeout);
    introTimeline.kill();
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