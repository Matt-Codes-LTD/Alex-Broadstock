// Core + sections
import initCursor from "./cursor.js";
import initSplitChars from "../sections/split-chars.js";
import initHomeHero from "../sections/home-hero.js";
import initProjectPlayer from "../sections/project-player.js";

/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
export function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
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
