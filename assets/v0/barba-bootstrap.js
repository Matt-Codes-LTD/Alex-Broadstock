/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach(fn => fn && fn());
}

/* =========================
   BOOTSTRAP (no barba.init here)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  // global cursor overlay (once)
  try { initCursor(); } catch (_) {}

  // hand control to transition module
  if (typeof initPageTransitionSwipe === "function") {
    initPageTransitionSwipe({
      overshoot: true // optional effect
    });
  } else {
    console.warn("[bootstrap] initPageTransitionSwipe not found — no transitions applied.");
    // fallback: still run scripts for first page
    const firstContainer = document.querySelector('[data-barba="container"]');
    if (firstContainer) initPageScripts(firstContainer);
  }
});
