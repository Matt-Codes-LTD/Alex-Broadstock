// assets/v1/sections/site-loader/ui-elements.js - UI creation
import { SELECTORS } from "./constants.js";

export function createUIElements(loaderEl, container) {
  const elements = {
    nameReveal: loaderEl.querySelector(SELECTORS.nameReveal),
    loaderContainer: loaderEl.querySelector(SELECTORS.container),
    heroVideoContainer: container.querySelector(SELECTORS.heroVideo)
  };

  // Create video wrapper and curtain
  const { videoWrapper, videoCurtain } = createVideoElements();
  
  // Insert into DOM
  const loaderContainer = elements.loaderContainer;
  if (loaderContainer) {
    loaderContainer.appendChild(videoWrapper);
  }
  
  return {
    ...elements,
    videoWrapper,
    videoCurtain
  };
}

function createVideoElements() {
  // Calculate dimensions
  const vwScreen = window.innerWidth <= 479 ? 479 :
                   window.innerWidth <= 767 ? 767 :
                   window.innerWidth <= 991 ? 991 : 1920;
  
  const videoWidth = 349 * (window.innerWidth / vwScreen);
  const videoHeight = 198 * (window.innerWidth / vwScreen);
  
  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'site-loader_video-wrapper';
  
  gsap.set(videoWrapper, {
    position: 'fixed',
    width: videoWidth,
    height: videoHeight,
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
    background: 'var(--swatch--brand-ink)'
  });
  
  videoWrapper.appendChild(videoCurtain);
  
  return { videoWrapper, videoCurtain };
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