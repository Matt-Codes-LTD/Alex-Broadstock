// site-loader/video-setup.js - Video creation with mobile fixes
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProject = container.querySelector(SELECTORS.firstProject);
  const videoUrl = firstProject?.dataset?.video;
  
  const video = document.createElement('video');
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  video.muted = true;
  video.setAttribute('muted', ''); // Critical for mobile autoplay
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', ''); // Critical for iOS inline play
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.setAttribute('crossorigin', 'anonymous'); // DOM attribute
  
  if (videoUrl) {
    video.src = videoUrl;
    console.log("[SiteLoader] Using video:", videoUrl);
    video.load();
    video.currentTime = 0.001;
    
    // Attempt early play for mobile
    video.play().catch((err) => {
      console.log("[SiteLoader] Early play failed:", err.message);
    });
  }
  
  videoWrapper.appendChild(video);
  
  // Mobile play trigger for site loader
  const triggerPlay = () => {
    if (video && video.paused) {
      video.play().catch((err) => {
        console.log("[SiteLoader] Mobile trigger play failed:", err.message);
      });
    }
  };
  
  // Add mobile triggers
  ['touchstart', 'click'].forEach(event => {
    document.addEventListener(event, triggerPlay, { once: true, passive: true });
  });
  
  return video;
}

export async function ensureVideoReady(video) {
  if (!video || video.__frameReady) return;
  
  // Ensure video has mobile attributes
  if (!video.hasAttribute('muted')) {
    video.setAttribute('muted', '');
  }
  if (!video.hasAttribute('playsinline')) {
    video.setAttribute('playsinline', '');
  }
  
  await new Promise(resolve => {
    const checkFrame = () => {
      if (video.readyState >= 3 && video.currentTime > 0) {
        if ('requestVideoFrameCallback' in video) {
          video.requestVideoFrameCallback(() => {
            video.__frameReady = true;
            resolve();
          });
        } else {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              video.__frameReady = true;
              resolve();
            });
          });
        }
      } else {
        // Try to play if not playing
        if (video.paused) {
          video.play().catch(() => {});
        }
        requestAnimationFrame(checkFrame);
      }
    };
    checkFrame();
  });
}