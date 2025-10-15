// assets/v1/sections/site-loader/video-setup.js - Fixed to use active category
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProjectList = getFirstProjectInActiveCategory(container);
  
  // Get the video URL from the child .home-hero_item element
  const firstProjectItem = firstProjectList?.querySelector('.home-hero_item');
  const videoUrl = firstProjectItem?.dataset?.video;
  
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
  // Try to find the active category button
  let activeBtn = document.querySelector('.home-category_text[aria-current="true"]');
  
  // If no active button, find the first non-"all" button (default behavior)
  if (!activeBtn) {
    console.log("[SiteLoader] No aria-current found, finding first valid category button");
    const allButtons = Array.from(document.querySelectorAll('.home-category_text'));
    activeBtn = allButtons.find(btn => normalize(btn.textContent) !== "all");
  }
  
  if (!activeBtn) {
    console.warn("[SiteLoader] No category buttons found, using fallback");
    return container.querySelector('.home-hero_item');
  }
  
  const activeCategoryName = normalize(activeBtn.textContent);
  console.log("[SiteLoader] Active category:", activeCategoryName);
  
  // Find all project items
  const allItems = Array.from(container.querySelectorAll('.home-hero_list'));
  console.log("[SiteLoader] Total project items found:", allItems.length);
  
  // Filter items by category (matches category-filter.js logic)
  const matchingItems = allItems.filter(item => {
    // Build categories from child pills (same as category-filter.js cacheCats)
    let cats = item.dataset.cats || "";
    
    // If data-cats doesn't exist yet, build it from children
    if (!cats) {
      const categoryPills = item.querySelectorAll('.home-category_ref_text');
      const catSet = new Set();
      categoryPills.forEach(pill => {
        const text = normalize(pill.textContent);
        if (text && text !== "all") {
          catSet.add(text);
        }
      });
      cats = Array.from(catSet).join("|");
    }
    
    const catArray = cats.split("|").map(c => c.trim()).filter(c => c);
    const matches = catArray.includes(activeCategoryName);
    
    const projectName = item.querySelector('.home_hero_text')?.textContent;
    console.log("[SiteLoader] Project:", projectName, "| cats:", cats, "| matches:", matches);
    
    return matches;
  });
  
  console.log("[SiteLoader] Found", matchingItems.length, "matching projects");
  
  if (matchingItems.length === 0) {
    console.warn("[SiteLoader] No items match active category:", activeCategoryName);
    return container.querySelector('.home-hero_item'); // Fallback
  }
  
  const firstProject = matchingItems[0];
  const projectName = firstProject.querySelector('.home_hero_text')?.textContent;
  const videoUrl = firstProject.querySelector('.home-hero_item')?.dataset?.video;
  console.log("[SiteLoader] ✅ Using first project in category:", projectName);
  console.log("[SiteLoader] ✅ Video URL:", videoUrl);
  
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