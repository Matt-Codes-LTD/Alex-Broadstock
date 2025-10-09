// assets/v1/sections/site-loader/video-setup.js - Video creation
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProject = container.querySelector(SELECTORS.firstProject);
  const videoUrl = firstProject?.dataset?.video;
  
  const video = document.createElement('video');
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.setAttribute('playsinline', ''); // Extra attribute for iOS
  video.setAttribute('webkit-playsinline', ''); // Extra for older iOS
  
  if (videoUrl) {
    video.src = videoUrl;
    console.log("[SiteLoader] Using video:", videoUrl);
    video.load();
  }
  
  videoWrapper.appendChild(video);
  return video;
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