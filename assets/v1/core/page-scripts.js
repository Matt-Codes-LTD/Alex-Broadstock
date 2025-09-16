// Core + sections
import initCursor from "../../globals/cursor/index.js";
import initSplitChars from "../sections/split-chars/index.js";
import initHomeHero from "../sections/home-hero/index.js";
import initProjectPlayer from "../sections/project-player/index.js";
import initSiteLoader from "../sections/site-loader/index.js";

/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
export function initPageScripts(container) {
  const cleanups = [];

  // Global-ish sections (safe everywhere)
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));

  // Site loader - only on home page direct visits/refreshes
  if (container.dataset.barbaNamespace === "home") {
    console.log("[SiteLoader] Checking for home page init");
    cleanups.push(initSiteLoader(container));
  }

  return () => cleanups.forEach((fn) => fn && fn());
}

/* =========================
   GLOBAL INIT (once only)
========================= */
export function initGlobal() {
  try {
    initCursor();
  } catch (e) {
    console.warn("[Cursor] init error", e);
  }
}