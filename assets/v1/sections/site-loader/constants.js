// site-loader/constants.js - Configuration with Enter button
export const CONFIG = {
  MIN_LOAD_TIME: 0, // Remove delay since we're waiting for Enter click
  ANIMATION: {
    morphDuration: 1.8,
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
  heroVideo: '.home-hero_video',
  heroContent: '.nav_wrap, .home-hero_menu, .home-awards_list',
  firstProject: '.home-hero_list:not([style*="display: none"]) .home-hero_item',
  enterButton: '.site-loader_enter'
};

export const EASES = {
  custom2InOut: "custom2InOut",
  sineInOut: "sine.inOut",
  powerOut: "power2.out",
  power3Out: "power3.out",
  power3InOut: "power3.inOut",
  backOut: "back.out(1.2)"
};