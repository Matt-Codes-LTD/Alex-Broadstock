// site-loader/video-setup.js - Video creation and management
import { SELECTORS } from "./constants.js";

export function setupVideo(container, videoWrapper) {
  const firstProject = container.querySelector(SELECTORS.firstProject);
  const videoUrl = firstProject?.dataset?.video;
  
  if (!videoUrl) {
    console.warn("[SiteLoader] No video URL found");
    return null;
  }
  
  const video = createVideo(videoUrl);
  videoWrapper.appendChild(video);
  
  // Pre-warm immediately
  warmVideo(video);
  
  return video;
}

function createVideo(src) {
  const video = document.createElement('video');
  
  Object.assign(video, {
    src,
    muted: true,
    loop: true,
    playsInline: true,
    preload: 'auto',
    crossOrigin: 'anonymous'
  });
  
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  
  console.log("[SiteLoader] Created video:", src);
  
  return video;
}

function warmVideo(video) {
  if (!video) return;
  
  video.load();
  video.currentTime = 0.001;
}

export async function ensureVideoReady(video) {
  if (!video || video.__frameReady) return;
  
  await new Promise(resolve => {
    const checkFrame = () => {
      if (video.readyState >= 3 && video.currentTime > 0) {
        // Use requestVideoFrameCallback if available
        if ('requestVideoFrameCallback' in video) {
          video.requestVideoFrameCallback(() => {
            video.__frameReady = true;
            resolve();
          });
        } else {
          // Fallback: wait for two animation frames
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              video.__frameReady = true;
              resolve();
            });
          });
        }
      } else {
        requestAnimationFrame(checkFrame);
      }
    };
    checkFrame();
  });
}

export function startVideoPlayback(video, progress) {
  if (!video || video.__started) return;
  
  if (progress >= 0.8) {
    video.__started = true;
    video.currentTime = 0.001;
    video.play().catch(() => {});
  }
}