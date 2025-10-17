// assets/v1/sections/site-loader/constants.js - Configuration with new timings
export const CONFIG = {
  MIN_LOAD_TIME: 2000,
  CURTAIN_DURATION: 0.9,  // Faster curtain
  MORPH_DURATION: 1.6,  // Smoother morph with cinematic ease
  MORPH_EASE: 'morphCinematic'  // Custom cinematic ease
};

export const SELECTORS = {
  loader: '.site-loader_wrap',
  container: '.site-loader_container',
  nameReveal: '.site-loader_name_reveal',
  heroVideo: '.home-hero_video',
  heroContent: '.nav_wrap, .home-hero_menu, .home-awards_list',
  firstProject: '.home-hero_list:not([style*="display: none"]) .home-hero_item'
};

export const EASES = {
  custom2InOut: "custom2InOut",
  sineInOut: "sine.inOut",
  powerOut: "power2.out",
  power3Out: "power3.out",
  power3InOut: "power3.inOut",
  power3In: "power3.in",  // Added for faster curtain
  backOut: "back.out(1.2)",
  cinematicInOut: "cinematicInOut",  // New cinematic ease
  morphCinematic: "morphCinematic"  // Specific morph ease
};