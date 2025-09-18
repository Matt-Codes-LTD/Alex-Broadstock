// site-loader/constants.js - Configuration and constants
export const CONFIG = {
  MIN_LOAD_TIME: 2000,
  VIDEO_START_THRESHOLD: 0.8,
  VIDEO_WARM_DELAY: 250,
  
  DIMENSIONS: {
    mobile: { maxWidth: 479, videoScale: 349 / 479, heightScale: 198 / 479 },
    tablet: { maxWidth: 767, videoScale: 349 / 767, heightScale: 198 / 767 },
    desktop: { maxWidth: 991, videoScale: 349 / 991, heightScale: 198 / 991 },
    default: { videoScale: 349 / 1920, heightScale: 198 / 1920 }
  },
  
  PROGRESS: {
    duration: 3,
    startWidth: 67,
    endWidth: 371,
    startHeight: 67,
    endHeight: 220
  },
  
  ANIMATION: {
    morphDuration: 1.8,
    curtainDuration: 1.6,
    fadeTextDuration: 0.3,
    revealVideoDuration: 0.3,
    uiFadeDuration: 0.6,
    edgesFadeDuration: 0.7,
    heroRevealStagger: 0.05
  }
};

export const SELECTORS = {
  loader: '.site-loader_wrap',
  container: '.site-loader_container',
  progressText: '.site-loader_progress-text',
  fpsCounter: '.site-loader_fps-counter',
  edgesBox: '.site-loader_edges',
  corners: '.site-loader_corner',
  videoHost: '.site-loader_video-host',
  
  // Hero elements
  heroVideo: '.home-hero_video',
  heroContent: '.nav_wrap, .home-hero_menu, .home-awards_list',
  firstProject: '.home-hero_list:not([style*="display: none"]) .home-hero_item'
};

export const EASES = {
  custom2InOut: "custom2InOut", // Registered in timeline.js
  o4: "o4",
  sineInOut: "sine.inOut",
  powerOut: "power2.out",
  power3Out: "power3.out",
  power3InOut: "power3.inOut",
  backOut: "back.out(1.2)"
};