// assets/v1/sections/home-hero/index.js
import { createVideoManager } from "./video-manager.js";
import { initCategoryFilter } from "./category-filter.js";

// Initialize blend effect for each project item
function initBlendEffect(section) {
  const items = section.querySelectorAll('.home-hero_list');
  
  items.forEach(item => {
    // Create blend bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'home-hero_blend-bars';
    barsContainer.setAttribute('data-direction', 'left');
    
    // Create staggered bars with varying --i values
    [3, 4, 5, 6, 7, 8, 10, 14, 18, 24, 30].forEach(i => {
      const bar = document.createElement('div');
      bar.className = 'home-hero_blend-bar';
      bar.style.setProperty('--i', i);
      barsContainer.appendChild(bar);
    });
    
    // Insert into the item
    item.appendChild(barsContainer);
    
    // Handle hover direction for animation origin
    item.addEventListener('mouseenter', (e) => {
      const rect = item.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const direction = mouseX < rect.width / 2 ? 'left' : 'right';
      barsContainer.setAttribute('data-direction', direction);
    });
    
    item.addEventListener('mouseleave', () => {
      barsContainer.setAttribute('data-direction', 'right');
    });
  });
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
    
    // Create transition timeline
    const tl = gsap.timeline();
    
    // Update aria-current states
    items.forEach(i => {
      const link = i.querySelector(".home-hero_link");
      if (link) {
        link.setAttribute("aria-current", i === item ? "true" : "false");
      }
    });
    
    // Fade states for text
    if (prevItem) {
      items.forEach(i => {
        const text = i.querySelector(".home_hero_text");
        const pills = i.querySelectorAll(".home-category_ref_text:not([hidden])");
        
        if (i === item) {
          tl.to([text, ...pills], {
            color: "inherit",
            duration: 0.3,
            ease: "power2.out"
          }, 0);
        } else {
          tl.to([text, ...pills], {
            color: "color-mix(in srgb, currentColor 60%, transparent)",
            duration: 0.2,
            ease: "power2.out"
          }, 0);
        }
      });
    }
    
    // Trigger video change with crossfade
    if (videoSrc && videoManager) {
      const linkEl = item.querySelector(".home-hero_link");
      if (linkEl) {
        linkEl.dataset.video = videoSrc;
        videoManager.setActive(videoSrc, linkEl);
      }
    }
    
    // Update awards with delay for better sequencing
    tl.call(() => updateAwards(item), null, 0.15);
  }

  // Preload videos
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

  // Initialize blend effect
  initBlendEffect(section);

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

  // Enhanced CSS for smoother animations
  if (!section.querySelector("[data-awards-css]")) {
    const style = document.createElement("style");
    style.setAttribute("data-awards-css", "");
    style.textContent = `
      .home-awards_list {
        opacity: 0;
        transition: none;
      }
      .home-awards_list.is-visible {
        opacity: 1;
      }
      .home-awards_list img {
        height: 4rem;
        width: auto;
        display: block;
        transform: translateY(0) scale(1);
      }
      
      .home-hero_video_el {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        pointer-events: none;
        opacity: 0;
        z-index: 0;
        will-change: opacity;
      }
      .home-hero_video_el.is-active { 
        z-index: 1; 
      }
      
      .home_hero_text,
      .home-category_ref_text {
        transition: color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: color;
      }
    `;
    section.appendChild(style);
  }

  // Initialize
  hideMetaTags();
  preloadVideos();
  
  // Set first visible item as active
  const firstVisible = items.find(item => item.style.display !== "none");
  if (firstVisible) {
    setActive(firstVisible);
  }

  // Cleanup function
  return () => {
    clearTimeout(hoverTimeout);
    listParent.removeEventListener("mouseenter", handleInteraction, true);
    listParent.removeEventListener("focusin", handleInteraction);
    listParent.removeEventListener("touchstart", handleInteraction);
    listParent.removeEventListener("click", handleInteraction);
    document.removeEventListener("visibilitychange", handleVisibility);
    cleanupFilter?.();
    delete section.dataset.scriptInitialized;
  };
}