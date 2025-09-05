/* =========================
   GLOBAL PREFS / HELPERS
========================= */
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const prefersReducedData   = matchMedia("(prefers-reduced-data: reduce)").matches;
const normalize = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
