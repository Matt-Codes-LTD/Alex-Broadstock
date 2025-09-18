// site-loader/ui-elements.js - UI creation and manipulation
import { CONFIG, SELECTORS } from "./constants.js";

export function createUIElements(loaderEl, container) {
  const elements = {
    progressText: loaderEl.querySelector(SELECTORS.progressText),
    fpsCounter: loaderEl.querySelector(SELECTORS.fpsCounter),
    edgesBox: loaderEl.querySelector(SELECTORS.edgesBox),
    corners: loaderEl.querySelectorAll(SELECTORS.corners),
    loaderContainer: loaderEl.querySelector(SELECTORS.container),
    heroVideoContainer: container.querySelector(SELECTORS.heroVideo)
  };

  // Create video wrapper and curtain
  const { videoWrapper, videoCurtain } = createVideoElements();
  
  // Insert into DOM
  insertVideoWrapper(loaderEl, videoWrapper, elements.edgesBox);
  
  return {
    ...elements,
    videoWrapper,
    videoCurtain
  };
}

function createVideoElements() {
  const { width, height } = getVideoDimensions();
  
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'site-loader_video-wrapper';
  
  gsap.set(videoWrapper, {
    position: 'fixed',
    width,
    height,
    left: '50%',
    top: '50%',
    xPercent: -50,
    yPercent: -50,
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    zIndex: 1,
    opacity: 0,
    overflow: 'hidden',
    transformOrigin: '50% 50%',
    willChange: 'transform, opacity',
    transform: 'translate3d(0,0,0)'
  });

  const videoCurtain = document.createElement('div');
  videoCurtain.className = 'site-loader_video-curtain';
  
  gsap.set(videoCurtain, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#020202'
  });
  
  videoWrapper.appendChild(videoCurtain);
  
  return { videoWrapper, videoCurtain };
}

function getVideoDimensions() {
  const screenWidth = window.innerWidth;
  let scale;
  
  if (screenWidth <= CONFIG.DIMENSIONS.mobile.maxWidth) {
    scale = CONFIG.DIMENSIONS.mobile;
  } else if (screenWidth <= CONFIG.DIMENSIONS.tablet.maxWidth) {
    scale = CONFIG.DIMENSIONS.tablet;
  } else if (screenWidth <= CONFIG.DIMENSIONS.desktop.maxWidth) {
    scale = CONFIG.DIMENSIONS.desktop;
  } else {
    scale = CONFIG.DIMENSIONS.default;
  }
  
  return {
    width: 349 * (screenWidth / (scale.maxWidth || 1920)),
    height: 198 * (screenWidth / (scale.maxWidth || 1920))
  };
}

function insertVideoWrapper(loaderEl, videoWrapper, edgesBox) {
  const container = loaderEl.querySelector(SELECTORS.container);
  
  if (edgesBox) {
    edgesBox.parentNode.insertBefore(videoWrapper, edgesBox);
  } else {
    container.appendChild(videoWrapper);
  }
}

export function lockScroll() {
  document.documentElement.classList.add('is-preloading');
  const lock = document.createElement('style');
  lock.textContent = `html.is-preloading, html.is-preloading body { overflow:hidden!important }`;
  document.head.appendChild(lock);
  return lock;
}

export function unlockScroll(lockElement) {
  document.documentElement.classList.remove('is-preloading');
  if (lockElement?.parentNode) {
    lockElement.remove();
  }
}

export function updateProgressUI(progressText, value) {
  if (progressText) {
    const pct = Math.round(value * 100);
    progressText.textContent = pct.toString().padStart(2, '0');
  }
}

export function updateEdgesUI(edgesBox, progress) {
  if (!edgesBox) return;
  
  const { startWidth, endWidth, startHeight, endHeight } = CONFIG.PROGRESS;
  const width = Math.round(startWidth + (endWidth - startWidth) * progress);
  const height = Math.round(startHeight + (endHeight - startHeight) * progress);
  
  gsap.set(edgesBox, {
    '--sl-width': width,
    '--sl-height': height
  });
}

export function updateFPSUI(fpsCounter, fps) {
  if (fpsCounter) {
    fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
  }
}