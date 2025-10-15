// assets/v1/sections/site-loader/video-setup.js - Fixed to use active category
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProject = getFirstProjectInActiveCategory(container);
  const videoUrl = firstProject?.dataset?.video;
  
  const video = document.createElement('video');
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  
  if (videoUrl) {
    video.src = videoUrl;
    console.log("[SiteLoader] Using video from active category:", videoUrl);
    video.load();
  } else {
    console.warn("[SiteLoader] No video found for active category");
  }
  
  videoWrapper.appendChild(video);
  return video;
}

/**
 * Find the first project in the currently active category
 * Matches the logic from category-filter.js
 */
function getFirstProjectInActiveCategory(container) {
  // Find the active category button
  const activeBtn = document.querySelector('.home-category_text[aria-current="true"]');
  
  if (!activeBtn) {
    console.warn("[SiteLoader] No active category found, using fallback");
    return container.querySelector('.home-hero_item');
  }
  
  const activeCategoryName = normalize(activeBtn.textContent);
  console.log("[SiteLoader] Active category:", activeCategoryName);
  
  // Find all project items
  const allItems = Array.from(container.querySelectorAll('.home-hero_list'));
  
  // Filter items by category (matches category-filter.js logic)
  const matchingItems = allItems.filter(item => {
    const cats = item.dataset.cats || "";
    const catArray = cats.split("|").map(c => c.trim()).filter(c => c);
    return catArray.includes(activeCategoryName);
  });
  
  if (matchingItems.length === 0) {
    console.warn("[SiteLoader] No items match active category:", activeCategoryName);
    return container.querySelector('.home-hero_item'); // Fallback
  }
  
  const firstProject = matchingItems[0];
  const projectName = firstProject.querySelector('.home_hero_text')?.textContent;
  console.log("[SiteLoader] Using first project in category:", projectName);
  
  return firstProject;
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

export async function ensureVideoReady(video) {
  if (!video) return;
  
  // Wait for video to have enough data
  await new Promise(resolve => {
    if (video.readyState >= 3) {
      resolve();
      return;
    }
    
    const onCanPlay = () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('canplaythrough', onCanPlay);
      resolve();
    };
    
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    
    // Timeout fallback
    setTimeout(resolve, 3000);
  });
  
  // Ensure video is at start
  try {
    video.currentTime = 0;
  } catch (err) {
    console.warn("[SiteLoader] Could not set currentTime:", err);
  }
  
  console.log("[SiteLoader] Video ready - readyState:", video.readyState);
}