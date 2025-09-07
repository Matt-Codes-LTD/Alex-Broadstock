/* =========================
   PAGE SCRIPTS (per Barba container)
========================= */
function initPageScripts(container) {
  const cleanups = [];
  cleanups.push(initSplitChars(container));
  cleanups.push(initHomeHero(container));
  cleanups.push(initProjectPlayer(container));
  return () => cleanups.forEach((fn) => fn && fn());
}

/* =========================
   BOOTSTRAP (no barba.init here)
========================= */
document.addEventListener("DOMContentLoaded", (() => {
  try { initCursor() } catch(e) {}
  const container = document.querySelector('[data-barba="container"]');
  if (container) initPageScripts(container);
}));

