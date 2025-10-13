// assets/v1/core/page-scripts.js
import initHomeHero from "../sections/home-hero/index.js";
import initProjectPlayer from "../sections/project-player/index.js";
import initSiteLoader from "../sections/site-loader/index.js";
import initMobileFilters from "../sections/mobile-filters/index.js";
import initProjectNavigation from "../sections/project-navigation/index.js";
import initProjectInfo from "../sections/project-info/index.js";
import initAboutOverlay from "../sections/about-overlay/index.js";

export function initPageScripts(container) {
  const cleanups = [];

  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  cleanups.push(initProjectNavigation(container));
  cleanups.push(initProjectInfo(container));
  cleanups.push(initAboutOverlay(container)); // Add this line
  
  if (container.dataset.barbaNamespace === "home") {
    cleanups.push(initMobileFilters(container));
  }

  if (container.dataset.barbaNamespace === "home" && window.__initialPageLoad) {
    console.log("[SiteLoader] Initializing for home page initial load");
    cleanups.push(initSiteLoader(container));
  }

  return () => cleanups.forEach((fn) => fn && fn());
}

export function initGlobal() {
  // Global initialization can remain empty or be used for other global features
  // Custom cursor initialization has been removed
}