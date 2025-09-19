// site-loader/video-setup.js - Video creation
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
  
  if (videoUrl) {
    video.src = videoUrl;
    console.log("[SiteLoader] Using video:", videoUrl);
    video.load();
    video.currentTime = 0.001;
  }
  
  videoWrapper.appendChild(video);
  return video;
}

export async function ensureVideoReady(video) {
  if (!video || video.__frameReady) return;
  
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
        requestAnimationFrame(checkFrame);
      }
    };
    checkFrame();
  });
}