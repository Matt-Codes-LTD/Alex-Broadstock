// site-loader/video-setup.js - Video creation with interaction check
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProject = container.querySelector(SELECTORS.firstProject);
  const videoUrl = firstProject?.dataset?.video;
  
  const video = document.createElement('video');
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  video.muted = true;
  video.setAttribute('muted', '');
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.setAttribute('crossorigin', 'anonymous');
  
  if (videoUrl) {
    video.src = videoUrl;
    console.log("[SiteLoader] Using video:", videoUrl);
    video.load();
    video.currentTime = 0.001;
    
    // Only try to play if user has already interacted
    if (window.__userInteracted) {
      video.play().catch((err) => {
        console.log("[SiteLoader] Play failed:", err.message);
      });
    }
  }
  
  videoWrapper.appendChild(video);
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
  
  // Wait for user interaction if needed
  if (!window.__userInteracted) {
    await new Promise(resolve => {
      const checkInteraction = () => {
        if (window.__userInteracted) {
          resolve();
        } else {
          setTimeout(checkInteraction, 100);
        }
      };
      checkInteraction();
    });
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
        // Try to play if not playing and user has interacted
        if (video.paused && window.__userInteracted) {
          video.play().catch(() => {});
        }
        requestAnimationFrame(checkFrame);
      }
    };
    checkFrame();
  });
}